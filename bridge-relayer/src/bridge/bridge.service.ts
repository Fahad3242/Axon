import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { ChainConfigService } from '../config/chain.config';
import { TransactionService } from '../transaction/transaction.service';
import { TransactionStatus } from '../transaction/transaction.entity';
import { BRIDGE_A_ABI, BRIDGE_B_ABI } from '../config/abis';

export interface LockEventData {
  sender: string;
  amount: bigint;
  destinationChainId: bigint;
  txHash: string;
  eventTxHash: string;
}

export interface BurnEventData {
  sender: string;
  amount: bigint;
  txHash: string;
  eventTxHash: string;
}

@Injectable()
export class BridgeService {
  private readonly logger = new Logger(BridgeService.name);
  private readonly sepoliaProvider: ethers.JsonRpcProvider;
  private readonly amoyProvider: ethers.JsonRpcProvider;
  private readonly sepoliaWallet: ethers.Wallet;
  private readonly amoyWallet: ethers.Wallet;

  constructor(
    private readonly configService: ChainConfigService,
    private readonly transactionService: TransactionService,
  ) {
    const sepoliaHttp = this.configService.sepoliaHttpRpc;
    const amoyHttp = this.configService.amoyHttpRpc;
    const privateKey = this.configService.relayerPrivateKey;

    if (!sepoliaHttp) {
      throw new Error('SEPOLIA_HTTP_RPC is not configured');
    }
    if (!amoyHttp) {
      throw new Error('AMOY_HTTP_RPC is not configured');
    }
    if (!privateKey) {
      throw new Error('RELAYER_PRIVATE_KEY is not configured');
    }

    this.sepoliaProvider = new ethers.JsonRpcProvider(sepoliaHttp);
    this.amoyProvider = new ethers.JsonRpcProvider(amoyHttp);
    this.sepoliaWallet = new ethers.Wallet(privateKey, this.sepoliaProvider);
    this.amoyWallet = new ethers.Wallet(privateKey, this.amoyProvider);
  }

  getSepoliaProvider(): ethers.JsonRpcProvider {
    return this.sepoliaProvider;
  }

  getAmoyProvider(): ethers.JsonRpcProvider {
    return this.amoyProvider;
  }

  getSepoliaWallet(): ethers.Wallet {
    return this.sepoliaWallet;
  }

  getAmoyWallet(): ethers.Wallet {
    return this.amoyWallet;
  }

  async waitForConfirmations(
    provider: ethers.JsonRpcProvider,
    txHash: string,
    confirmations: number,
  ): Promise<ethers.TransactionReceipt> {
    for (let attempt = 1; attempt <= 100; attempt++) {
      try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt) {
          const currentBlock = await provider.getBlockNumber();
          const txConfirmations = currentBlock - receipt.blockNumber + 1;
          this.logger.log(
            `Tx ${txHash}: current confirmations = ${txConfirmations} (target = ${confirmations}), attempt ${attempt}/100`,
          );
          if (txConfirmations >= confirmations) {
            return receipt;
          }
        } else {
          this.logger.log(`Tx ${txHash}: receipt not found yet, attempt ${attempt}/100`);
        }
      } catch (err) {
        this.logger.warn(
          `Error on attempt ${attempt}/100 fetching confirmations for ${txHash}: ${err.message}`,
        );
      }
      if (attempt < 100) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
    throw new Error(
      `Transaction ${txHash} failed to reach ${confirmations} confirmations after 100 attempts`,
    );
  }

  async handleLock(event: LockEventData): Promise<void> {
    this.logger.log(
      `Handling TokenLocked event: srcTxHash=${event.txHash}, eventTxHash=${event.eventTxHash}`,
    );
    try {
      // 1. Check if srcTxHash already exists in DB — if yes, skip (idempotency)
      const existing = await this.transactionService.findBySrcTxHash(event.txHash);
      if (existing) {
        this.logger.log(`Transaction ${event.txHash} already exists in DB. Skipping.`);
        return;
      }

      // 2. Create DB record with status PENDING
      await this.transactionService.create({
        srcChain: 'sepolia',
        srcTxHash: event.txHash,
        sender: event.sender,
        amount: event.amount.toString(),
        eventTxHash: event.eventTxHash,
      });

      // 3. Wait for 6 confirmations on Sepolia (poll every 5s)
      this.logger.log(
        `Waiting for 6 confirmations on Sepolia for event transaction ${event.eventTxHash}...`,
      );
      await this.waitForConfirmations(this.sepoliaProvider, event.eventTxHash, 6);

      // 4. Update status to CONFIRMING
      this.logger.log(`Updating transaction ${event.txHash} status to CONFIRMING`);
      await this.transactionService.updateStatus(event.txHash, TransactionStatus.CONFIRMING);

      // 5. Call mintTokens() on BridgeB using amoySigner
      const bridgeBAddress = this.configService.bridgeBAddress;
      if (!bridgeBAddress) {
        throw new Error('BRIDGE_B_ADDRESS is not configured');
      }
      const bridgeBContract = new ethers.Contract(bridgeBAddress, BRIDGE_B_ABI, this.amoyWallet);

      // Check if already processed on BridgeB
      const isProcessed = await bridgeBContract.processedTxs(event.txHash);
      if (isProcessed) {
        this.logger.warn(
          `Transaction ${event.txHash} already processed on BridgeB. Updating status to COMPLETED.`,
        );
        await this.transactionService.updateStatus(event.txHash, TransactionStatus.COMPLETED);
        return;
      }

      this.logger.log(
        `Calling mintTokens on BridgeB (${bridgeBAddress}) for recipient ${event.sender}, amount ${event.amount.toString()}, srcTxHash ${event.txHash}`,
      );
      const txResponse = await bridgeBContract.mintTokens(event.sender, event.amount, event.txHash);
      this.logger.log(`mintTokens transaction submitted: ${txResponse.hash}`);

      // 6. Update status to RELAYING with the dest txHash
      this.logger.log(
        `Updating transaction ${event.txHash} status to RELAYING with destTxHash ${txResponse.hash}`,
      );
      await this.transactionService.updateStatus(
        event.txHash,
        TransactionStatus.RELAYING,
        txResponse.hash,
      );

      // 7. Wait for 2 confirmations on Amoy
      this.logger.log(
        `Waiting for 2 confirmations on Amoy for destination transaction ${txResponse.hash}...`,
      );
      await this.waitForConfirmations(this.amoyProvider, txResponse.hash, 2);

      // 8. Update status to COMPLETED
      this.logger.log(`Updating transaction ${event.txHash} status to COMPLETED`);
      await this.transactionService.updateStatus(
        event.txHash,
        TransactionStatus.COMPLETED,
        txResponse.hash,
      );

      this.logger.log(`Successfully completed lock relay for ${event.txHash}`);
    } catch (err) {
      this.logger.error(`Error in handleLock for tx ${event.txHash}: ${err.message}`, err.stack);
      try {
        await this.transactionService.updateStatus(
          event.txHash,
          TransactionStatus.FAILED,
          undefined,
          err.message,
        );
      } catch (dbErr) {
        this.logger.error(`Failed to update transaction status to FAILED: ${dbErr.message}`);
      }
    }
  }

  async handleBurn(event: BurnEventData): Promise<void> {
    this.logger.log(
      `Handling TokenBurned event: srcTxHash=${event.txHash}, eventTxHash=${event.eventTxHash}`,
    );
    try {
      // 1. Check if srcTxHash already exists in DB — if yes, skip (idempotency)
      const existing = await this.transactionService.findBySrcTxHash(event.txHash);
      if (existing) {
        this.logger.log(`Transaction ${event.txHash} already exists in DB. Skipping.`);
        return;
      }

      // 2. Create DB record with status PENDING
      await this.transactionService.create({
        srcChain: 'amoy',
        srcTxHash: event.txHash,
        sender: event.sender,
        amount: event.amount.toString(),
        eventTxHash: event.eventTxHash,
      });

      // 3. Wait for 10 confirmations on Amoy (poll every 5s)
      this.logger.log(
        `Waiting for 10 confirmations on Amoy for event transaction ${event.eventTxHash}...`,
      );
      await this.waitForConfirmations(this.amoyProvider, event.eventTxHash, 10);

      // 4. Update status to CONFIRMING
      this.logger.log(`Updating transaction ${event.txHash} status to CONFIRMING`);
      await this.transactionService.updateStatus(event.txHash, TransactionStatus.CONFIRMING);

      // 5. Call releaseTokens() on BridgeA using sepoliaSigner
      const bridgeAAddress = this.configService.bridgeAAddress;
      if (!bridgeAAddress) {
        throw new Error('BRIDGE_A_ADDRESS is not configured');
      }
      const bridgeAContract = new ethers.Contract(bridgeAAddress, BRIDGE_A_ABI, this.sepoliaWallet);

      // Check if already processed on BridgeA
      const isProcessed = await bridgeAContract.processedTxs(event.txHash);
      if (isProcessed) {
        this.logger.warn(
          `Transaction ${event.txHash} already processed on BridgeA. Updating status to COMPLETED.`,
        );
        await this.transactionService.updateStatus(event.txHash, TransactionStatus.COMPLETED);
        return;
      }

      this.logger.log(
        `Calling releaseTokens on BridgeA (${bridgeAAddress}) for recipient ${event.sender}, amount ${event.amount.toString()}, srcTxHash ${event.txHash}`,
      );
      const txResponse = await bridgeAContract.releaseTokens(
        event.sender,
        event.amount,
        event.txHash,
      );
      this.logger.log(`releaseTokens transaction submitted: ${txResponse.hash}`);

      // 6. Update status to RELAYING with the dest txHash
      this.logger.log(
        `Updating transaction ${event.txHash} status to RELAYING with destTxHash ${txResponse.hash}`,
      );
      await this.transactionService.updateStatus(
        event.txHash,
        TransactionStatus.RELAYING,
        txResponse.hash,
      );

      // 7. Wait for 6 confirmations on Sepolia
      this.logger.log(
        `Waiting for 6 confirmations on Sepolia for destination transaction ${txResponse.hash}...`,
      );
      await this.waitForConfirmations(this.sepoliaProvider, txResponse.hash, 6);

      // 8. Update status to COMPLETED
      this.logger.log(`Updating transaction ${event.txHash} status to COMPLETED`);
      await this.transactionService.updateStatus(
        event.txHash,
        TransactionStatus.COMPLETED,
        txResponse.hash,
      );

      this.logger.log(`Successfully completed burn relay for ${event.txHash}`);
    } catch (err) {
      this.logger.error(`Error in handleBurn for tx ${event.txHash}: ${err.message}`, err.stack);
      try {
        await this.transactionService.updateStatus(
          event.txHash,
          TransactionStatus.FAILED,
          undefined,
          err.message,
        );
      } catch (dbErr) {
        this.logger.error(`Failed to update transaction status to FAILED: ${dbErr.message}`);
      }
    }
  }
}
