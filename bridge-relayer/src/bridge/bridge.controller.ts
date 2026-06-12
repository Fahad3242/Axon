import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { TransactionService } from '../transaction/transaction.service';
import { ExecutorService } from './executor.service';
import { TxStatusDto } from './dto/tx-status.dto';

@Controller('bridge')
export class BridgeController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly executorService: ExecutorService,
  ) {}

  @Get('transactions')
  async getAllTransactions() {
    return this.transactionService.findAll();
  }

  @Get('status/:srcTxHash')
  async getStatus(@Param() params: TxStatusDto) {
    const tx = await this.transactionService.findBySrcTxHash(params.srcTxHash);
    if (!tx) {
      throw new NotFoundException(`Transaction with source hash ${params.srcTxHash} not found`);
    }
    return tx;
  }

  @Post('relay')
  async forceRelay(@Body() body: TxStatusDto) {
    const tx = await this.transactionService.findBySrcTxHash(body.srcTxHash);
    if (!tx) {
      throw new NotFoundException(`Transaction with source hash ${body.srcTxHash} not found`);
    }
    
    // Trigger asynchronously or wait, let's trigger it and return status
    this.executorService.relayTransaction(tx);
    return { message: 'Relay execution triggered', srcTxHash: body.srcTxHash };
  }
}
