import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BridgeModule } from './bridge/bridge.module';
import { TransactionModule } from './transaction/transaction.module';
import { HealthController } from './health/health.controller';
import { Transaction } from './transaction/transaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [Transaction],
        // WARNING: synchronize: true should not be used in production.
        // It automatically aligns the DB schema with TypeORM entities,
        // which can lead to columns/tables dropping and data loss during modifications.
        // For production, synchronize should be false and migrations configured.
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    BridgeModule,
    TransactionModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
