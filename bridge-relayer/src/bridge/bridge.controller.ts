import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { TransactionService } from '../transaction/transaction.service';
import { ExecutorService } from './executor.service';
import { TxStatusDto } from './dto/tx-status.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';

@ApiTags('bridge')
@Controller('bridge')
export class BridgeController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly executorService: ExecutorService,
  ) {}

  @Get('transactions')
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiResponse({ status: 200, description: 'Return last 50 transaction records.' })
  async getAllTransactions() {
    return this.transactionService.findAll();
  }

  @Get('status/:srcTxHash')
  @ApiOperation({ summary: 'Get transaction status by source hash' })
  @ApiResponse({ status: 200, description: 'Return transaction status.' })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async getStatus(@Param() params: TxStatusDto) {
    const tx = await this.transactionService.findBySrcTxHash(params.srcTxHash);
    if (!tx) {
      throw new NotFoundException(`Transaction with source hash ${params.srcTxHash} not found`);
    }
    return tx;
  }

  @Post('relay')
  @ApiOperation({ summary: 'Force trigger relay for a transaction' })
  @ApiResponse({ status: 200, description: 'Relay execution triggered.' })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async forceRelay(@Body() body: TxStatusDto) {
    const tx = await this.transactionService.findBySrcTxHash(body.srcTxHash);
    if (!tx) {
      throw new NotFoundException(`Transaction with source hash ${body.srcTxHash} not found`);
    }
    
    this.executorService.relayTransaction(tx);
    return { message: 'Relay execution triggered', srcTxHash: body.srcTxHash };
  }

  @Get('tx/:srcTxHash')
  @ApiOperation({ summary: 'Get transaction by source transaction hash' })
  @ApiParam({ name: 'srcTxHash', description: 'The source transaction hash' })
  @ApiResponse({ status: 200, description: 'Return the transaction record.' })
  @ApiResponse({ status: 404, description: 'Transaction with source hash not found.' })
  async getTxByHash(@Param('srcTxHash') srcTxHash: string) {
    const tx = await this.transactionService.findBySrcTxHash(srcTxHash);
    if (!tx) {
      throw new NotFoundException(`Transaction with source hash ${srcTxHash} not found`);
    }
    return tx;
  }

  @Get('history/:walletAddress')
  @ApiOperation({ summary: 'Get all transactions for a specific wallet address' })
  @ApiParam({ name: 'walletAddress', description: 'The wallet address of the sender' })
  @ApiResponse({ status: 200, description: 'Return wallet transaction history.' })
  async getWalletHistory(@Param('walletAddress') walletAddress: string) {
    return this.transactionService.findBySender(walletAddress);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get the last 50 transactions for the dashboard' })
  @ApiResponse({ status: 200, description: 'Return last 50 transactions.' })
  async getLastFiftyTransactions() {
    return this.transactionService.findAll();
  }
}
