import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { ChainConfigService } from '../config/chain.config';
import { BridgeService, BRIDGE_A_ABI, BRIDGE_B_ABI } from './bridge.service';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class ListenerService implements OnModuleInit {
  private readonly logger = new Logger(ListenerService.name);

  constructor(
    private readonly configService: ChainConfigService,
    private readonly bridgeService: BridgeService,
    private readonly transactionService: TransactionService,
  ) {}

  onModuleInit() {
    this.startListeners();
  }

  private startListeners() {
    this.logger.log('Starting Bridge Event Listeners...');
    this.listenToSepolia();
    this.listenToAmoy();
  }

  private listenToSepolia() {
    const provider = this.bridgeService.getSepoliaProvider();
    const address = this.configService.bridgeAAddress;

    if (!provider || !address) {
      this.logger.warn('Sepolia provider or Bridge A address not configured. Skipping listener.');
      return;
    }

    try {
      const contract = new ethers.Contract(address, BRIDGE_A_ABI, provider);
      this.logger.log(`Listening for TokenLocked on Bridge A: ${address} (Sepolia)`);

      contract.on('TokenLocked', async (sender: string, amount: bigint, destinationChainId: bigint, txHash: string, event: any) => {
        this.logger.log(
          `TokenLocked Event: Sender=${sender}, Amount=${amount.toString()}, DestChainId=${destinationChainId.toString()}, Hash=${txHash}`,
        );
        try {
          await this.transactionService.createPending(
            11155111, // Sepolia Chain ID
            Number(destinationChainId),
            txHash,
            sender,
            amount.toString(),
          );
          this.logger.log(`Logged PENDING lock transaction: ${txHash}`);
        } catch (err) {
          this.logger.error(`Failed to handle TokenLocked event for txHash ${txHash}: ${err.message}`);
        }
      });
    } catch (err) {
      this.logger.error(`Error initializing Sepolia event listener: ${err.message}`);
    }
  }

  private listenToAmoy() {
    const provider = this.bridgeService.getAmoyProvider();
    const address = this.configService.bridgeBAddress;

    if (!provider || !address) {
      this.logger.warn('Amoy provider or Bridge B address not configured. Skipping listener.');
      return;
    }

    try {
      const contract = new ethers.Contract(address, BRIDGE_B_ABI, provider);
      this.logger.log(`Listening for TokenBurned on Bridge B: ${address} (Amoy)`);

      contract.on('TokenBurned', async (sender: string, amount: bigint, txHash: string, event: any) => {
        this.logger.log(
          `TokenBurned Event: Sender=${sender}, Amount=${amount.toString()}, Hash=${txHash}`,
        );
        try {
          await this.transactionService.createPending(
            80002, // Amoy Chain ID
            11155111, // Sepolia Chain ID
            txHash,
            sender,
            amount.toString(),
          );
          this.logger.log(`Logged PENDING burn transaction: ${txHash}`);
        } catch (err) {
          this.logger.error(`Failed to handle TokenBurned event for txHash ${txHash}: ${err.message}`);
        }
      });
    } catch (err) {
      this.logger.error(`Error initializing Amoy event listener: ${err.message}`);
    }
  }
}
