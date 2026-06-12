import { Module } from '@nestjs/common';
import { ChainConfigService } from '../config/chain.config';
import { BridgeService } from './bridge.service';
import { ListenerService } from './listener.service';
import { ExecutorService } from './executor.service';
import { BridgeController } from './bridge.controller';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [TransactionModule],
  controllers: [BridgeController],
  providers: [
    ChainConfigService,
    BridgeService,
    ListenerService,
    ExecutorService,
  ],
  exports: [
    ChainConfigService,
    BridgeService,
  ],
})
export class BridgeModule {}
