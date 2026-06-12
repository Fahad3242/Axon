import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ethers } from 'ethers';
import { ChainConfigService } from '../config/chain.config';
import { BridgeService } from './bridge.service';
import { BRIDGE_A_ABI, BRIDGE_B_ABI } from '../config/abis';
import { TransactionService } from '../transaction/transaction.service';
import { Transaction, TransactionStatus } from '../transaction/transaction.entity';

@Injectable()
export class ExecutorService {
  private readonly logger = new Logger(ExecutorService.name);
  private isProcessing = false;

  constructor(
    private readonly configService: ChainConfigService,
    private readonly bridgeService: BridgeService,
    private readonly transactionService: TransactionService,
  ) {}

  // @Interval(10000) // Poll every 10 seconds
  async processPendingTransactions() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      const pendingTxs = await this.transactionService.findPending();
      if (pendingTxs.length > 0) {
        this.logger.log(`Found ${pendingTxs.length} pending transaction(s) to relay`);
      }

      for (const tx of pendingTxs) {
        await this.relayTransaction(tx);
      }
    } catch (err) {
      this.logger.error(`Error in transaction executor loop: ${err.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  async relayTransaction(tx: Transaction) {
    this.logger.log(`Relaying tx ${tx.srcTxHash} from chain ${tx.srcChain}...`);

    // Mark as RELAYING immediately to prevent double processing
    await this.transactionService.updateStatus(tx.srcTxHash, TransactionStatus.RELAYING);

    try {
      if (tx.srcChain === 'sepolia') {
        // Sepolia -> Amoy (Lock to Mint)
        await this.executeMintOnAmoy(tx);
      } else if (tx.srcChain === 'amoy') {
        // Amoy -> Sepolia (Burn to Release)
        await this.executeReleaseOnSepolia(tx);
      } else {
        throw new Error(`Unsupported source chain: ${tx.srcChain}`);
      }
    } catch (err) {
      this.logger.error(`Failed relay for tx ${tx.srcTxHash}: ${err.message}`);
      await this.transactionService.updateStatus(
        tx.srcTxHash,
        TransactionStatus.FAILED,
        undefined,
        err.message,
      );
    }
  }

  private async executeMintOnAmoy(tx: Transaction) {
    const wallet = this.bridgeService.getAmoyWallet();
    const address = this.configService.bridgeBAddress;

    if (!wallet || !address) {
      throw new Error('Amoy relayer wallet or Bridge B address not configured');
    }

    const contract = new ethers.Contract(address, BRIDGE_B_ABI, wallet);

    this.logger.log(`Sending mintTokens on Bridge B (${address}) for sender/recipient ${tx.sender}, amount ${tx.amount}`);
    
    try {
      const txResponse = await contract.mintTokens(tx.sender, tx.amount, tx.srcTxHash);
      this.logger.log(`Transaction sent: ${txResponse.hash}. Transitioning to CONFIRMING...`);
      
      // Mark as CONFIRMING and store the destination transaction hash
      await this.transactionService.updateStatus(
        tx.srcTxHash,
        TransactionStatus.CONFIRMING,
        txResponse.hash,
      );

      const receipt = await txResponse.wait();
      this.logger.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      
      // Update status to COMPLETED
      await this.transactionService.updateStatus(
        tx.srcTxHash,
        TransactionStatus.COMPLETED,
        txResponse.hash,
      );
    } catch (err) {
      if (err.message && err.message.includes('already processed')) {
        this.logger.warn(`Transaction already processed on-chain. Marking as COMPLETED.`);
        await this.transactionService.updateStatus(
          tx.srcTxHash,
          TransactionStatus.COMPLETED,
        );
      } else {
        throw err;
      }
    }
  }

  private async executeReleaseOnSepolia(tx: Transaction) {
    const wallet = this.bridgeService.getSepoliaWallet();
    const address = this.configService.bridgeAAddress;

    if (!wallet || !address) {
      throw new Error('Sepolia relayer wallet or Bridge A address not configured');
    }

    const contract = new ethers.Contract(address, BRIDGE_A_ABI, wallet);

    this.logger.log(`Sending releaseTokens on Bridge A (${address}) for sender/recipient ${tx.sender}, amount ${tx.amount}`);

    try {
      const txResponse = await contract.releaseTokens(tx.sender, tx.amount, tx.srcTxHash);
      this.logger.log(`Transaction sent: ${txResponse.hash}. Transitioning to CONFIRMING...`);

      // Mark as CONFIRMING and store the destination transaction hash
      await this.transactionService.updateStatus(
        tx.srcTxHash,
        TransactionStatus.CONFIRMING,
        txResponse.hash,
      );

      const receipt = await txResponse.wait();
      this.logger.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      // Update status to COMPLETED
      await this.transactionService.updateStatus(
        tx.srcTxHash,
        TransactionStatus.COMPLETED,
        txResponse.hash,
      );
    } catch (err) {
      if (err.message && err.message.includes('already processed')) {
        this.logger.warn(`Transaction already processed on-chain. Marking as COMPLETED.`);
        await this.transactionService.updateStatus(
          tx.srcTxHash,
          TransactionStatus.COMPLETED,
        );
      } else {
        throw err;
      }
    }
  }
}
