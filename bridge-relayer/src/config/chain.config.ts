import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChainConfigService {
  constructor(private configService: ConfigService) {}

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL') ?? 'postgresql://postgres:postgres@localhost:5432/bridge_relayer';
  }

  get sepoliaHttpRpc(): string | undefined {
    return this.configService.get<string>('SEPOLIA_HTTP_RPC');
  }

  get sepoliaWsRpc(): string | undefined {
    return this.configService.get<string>('SEPOLIA_WS_RPC');
  }

  get amoyHttpRpc(): string | undefined {
    return this.configService.get<string>('AMOY_HTTP_RPC');
  }

  get amoyWsRpc(): string | undefined {
    return this.configService.get<string>('AMOY_WS_RPC');
  }

  get bridgeAAddress(): string | undefined {
    return this.configService.get<string>('BRIDGE_A_ADDRESS');
  }

  get bridgeBAddress(): string | undefined {
    return this.configService.get<string>('BRIDGE_B_ADDRESS');
  }

  get relayerPrivateKey(): string | undefined {
    return this.configService.get<string>('RELAYER_PRIVATE_KEY');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3001);
  }
}
