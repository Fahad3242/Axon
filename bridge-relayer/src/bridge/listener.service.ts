import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { ChainConfigService } from '../config/chain.config';
import { BridgeService } from './bridge.service';
import { BRIDGE_A_ABI, BRIDGE_B_ABI } from '../config/abis';

@Injectable()
export class ListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ListenerService.name);
  private sepoliaProvider: ethers.WebSocketProvider | null = null;
  private amoyProvider: ethers.WebSocketProvider | null = null;
  private sepoliaContract: ethers.Contract | null = null;
  private amoyContract: ethers.Contract | null = null;
  private isDestroyed = false;

  constructor(
    private readonly configService: ChainConfigService,
    private readonly bridgeService: BridgeService,
  ) {}

  onModuleInit() {
    this.startListeners();
  }

  onModuleDestroy() {
    this.isDestroyed = true;
    this.cleanupSepolia();
    this.cleanupAmoy();
  }

  private startListeners() {
    this.logger.log('Initializing Bridge WebSocket Listeners...');
    this.connectSepolia();
    this.connectAmoy();
  }

  private connectSepolia(attempt = 1) {
    if (this.isDestroyed) return;

    const wsUrl = this.configService.sepoliaWsRpc;
    const address = this.configService.bridgeAAddress;

    if (!wsUrl || !address) {
      this.logger.warn('SEPOLIA_WS_RPC or BRIDGE_A_ADDRESS not configured. Skipping Sepolia WS listener.');
      return;
    }

    this.logger.log(`Connecting to Sepolia WS (Attempt ${attempt}): ${wsUrl}`);
    try {
      this.sepoliaProvider = new ethers.WebSocketProvider(wsUrl);
      this.sepoliaContract = new ethers.Contract(address, BRIDGE_A_ABI, this.sepoliaProvider);

      this.sepoliaContract.on(
        'TokenLocked',
        async (sender: string, amount: bigint, destinationChainId: bigint, txHash: string, event: any) => {
          const eventTxHash = event?.log?.transactionHash || event?.transactionHash || '';
          this.logger.log(`[Sepolia Event] TokenLocked: txHash=${txHash}, eventTx=${eventTxHash}`);
          await this.bridgeService.handleLock({
            sender,
            amount,
            destinationChainId,
            txHash,
            eventTxHash,
          });
        },
      );

      const ws = this.sepoliaProvider.websocket as any;
      if (ws) {
        ws.on('close', () => {
          this.logger.warn('Sepolia WebSocket connection closed. Reconnecting in 5 seconds...');
          this.reconnectSepolia(attempt + 1);
        });

        ws.on('error', (err: any) => {
          this.logger.error(`Sepolia WebSocket error: ${err.message || err}. Reconnecting in 5 seconds...`);
          this.reconnectSepolia(attempt + 1);
        });
      }
    } catch (err) {
      this.logger.error(`Failed to connect to Sepolia WS: ${err.message || err}. Reconnecting in 5 seconds...`);
      this.reconnectSepolia(attempt + 1);
    }
  }

  private reconnectSepolia(nextAttempt: number) {
    this.cleanupSepolia();
    setTimeout(() => {
      this.connectSepolia(nextAttempt);
    }, 5000);
  }

  private cleanupSepolia() {
    try {
      if (this.sepoliaContract) {
        this.sepoliaContract.removeAllListeners();
        this.sepoliaContract = null;
      }
      if (this.sepoliaProvider) {
        this.sepoliaProvider.destroy();
        this.sepoliaProvider = null;
      }
    } catch (err) {
      this.logger.error(`Error cleaning up Sepolia WS connection: ${err.message}`);
    }
  }

  private connectAmoy(attempt = 1) {
    if (this.isDestroyed) return;

    const wsUrl = this.configService.amoyWsRpc;
    const address = this.configService.bridgeBAddress;

    if (!wsUrl || !address) {
      this.logger.warn('AMOY_WS_RPC or BRIDGE_B_ADDRESS not configured. Skipping Amoy WS listener.');
      return;
    }

    this.logger.log(`Connecting to Amoy WS (Attempt ${attempt}): ${wsUrl}`);
    try {
      this.amoyProvider = new ethers.WebSocketProvider(wsUrl);
      this.amoyContract = new ethers.Contract(address, BRIDGE_B_ABI, this.amoyProvider);

      this.amoyContract.on('TokenBurned', async (sender: string, amount: bigint, txHash: string, event: any) => {
        const eventTxHash = event?.log?.transactionHash || event?.transactionHash || '';
        this.logger.log(`[Amoy Event] TokenBurned: txHash=${txHash}, eventTx=${eventTxHash}`);
        await this.bridgeService.handleBurn({
          sender,
          amount,
          txHash,
          eventTxHash,
        });
      });

      const ws = this.amoyProvider.websocket as any;
      if (ws) {
        ws.on('close', () => {
          this.logger.warn('Amoy WebSocket connection closed. Reconnecting in 5 seconds...');
          this.reconnectAmoy(attempt + 1);
        });

        ws.on('error', (err: any) => {
          this.logger.error(`Amoy WebSocket error: ${err.message || err}. Reconnecting in 5 seconds...`);
          this.reconnectAmoy(attempt + 1);
        });
      }
    } catch (err) {
      this.logger.error(`Failed to connect to Amoy WS: ${err.message || err}. Reconnecting in 5 seconds...`);
      this.reconnectAmoy(attempt + 1);
    }
  }

  private reconnectAmoy(nextAttempt: number) {
    this.cleanupAmoy();
    setTimeout(() => {
      this.connectAmoy(nextAttempt);
    }, 5000);
  }

  private cleanupAmoy() {
    try {
      if (this.amoyContract) {
        this.amoyContract.removeAllListeners();
        this.amoyContract = null;
      }
      if (this.amoyProvider) {
        this.amoyProvider.destroy();
        this.amoyProvider = null;
      }
    } catch (err) {
      this.logger.error(`Error cleaning up Amoy WS connection: ${err.message}`);
    }
  }
}
