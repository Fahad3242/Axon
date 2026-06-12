import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { ChainConfigService } from '../config/chain.config';

export const BRIDGE_A_ABI = [
  'event TokenLocked(address indexed sender, uint256 amount, uint256 destinationChainId, bytes32 txHash)',
  'event TokenReleased(address indexed recipient, uint256 amount, bytes32 srcTxHash)',
  'function releaseTokens(address recipient, uint256 amount, bytes32 srcTxHash) external',
];

export const BRIDGE_B_ABI = [
  'event TokenMinted(address indexed recipient, uint256 amount, bytes32 srcTxHash)',
  'event TokenBurned(address indexed sender, uint256 amount, bytes32 txHash)',
  'function mintTokens(address recipient, uint256 amount, bytes32 srcTxHash) external',
];

@Injectable()
export class BridgeService {
  private readonly logger = new Logger(BridgeService.name);
  private sepoliaProvider: ethers.JsonRpcProvider | null = null;
  private amoyProvider: ethers.JsonRpcProvider | null = null;
  private sepoliaWallet: ethers.Wallet | null = null;
  private amoyWallet: ethers.Wallet | null = null;

  constructor(private readonly configService: ChainConfigService) {
    this.initializeProviders();
  }

  private initializeProviders() {
    const sepoliaHttp = this.configService.sepoliaHttpRpc;
    const amoyHttp = this.configService.amoyHttpRpc;
    const privateKey = this.configService.relayerPrivateKey;

    if (sepoliaHttp) {
      this.sepoliaProvider = new ethers.JsonRpcProvider(sepoliaHttp);
      if (privateKey) {
        this.sepoliaWallet = new ethers.Wallet(privateKey, this.sepoliaProvider);
      }
    } else {
      this.logger.warn('SEPOLIA_HTTP_RPC is not configured.');
    }

    if (amoyHttp) {
      this.amoyProvider = new ethers.JsonRpcProvider(amoyHttp);
      if (privateKey) {
        this.amoyWallet = new ethers.Wallet(privateKey, this.amoyProvider);
      }
    } else {
      this.logger.warn('AMOY_HTTP_RPC is not configured.');
    }
  }

  getSepoliaProvider(): ethers.JsonRpcProvider | null {
    return this.sepoliaProvider;
  }

  getAmoyProvider(): ethers.JsonRpcProvider | null {
    return this.amoyProvider;
  }

  getSepoliaWallet(): ethers.Wallet | null {
    return this.sepoliaWallet;
  }

  getAmoyWallet(): ethers.Wallet | null {
    return this.amoyWallet;
  }
}
