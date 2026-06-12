import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from './transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async createPending(
    srcChainId: number,
    destChainId: number,
    srcTxHash: string,
    recipient: string,
    amount: string,
  ): Promise<Transaction> {
    const existing = await this.findBySrcTxHash(srcTxHash);
    if (existing) {
      return existing;
    }

    const tx = this.transactionRepository.create({
      srcChainId,
      destChainId,
      srcTxHash: srcTxHash.toLowerCase(),
      recipient: recipient.toLowerCase(),
      amount,
      status: TransactionStatus.PENDING,
    });
    return this.transactionRepository.save(tx);
  }

  async updateStatus(
    srcTxHash: string,
    status: TransactionStatus,
    destTxHash?: string,
    errorMessage?: string,
  ): Promise<Transaction> {
    const tx = await this.transactionRepository.findOneByOrFail({
      srcTxHash: srcTxHash.toLowerCase(),
    });

    tx.status = status;
    if (destTxHash) {
      tx.destTxHash = destTxHash.toLowerCase();
    }
    if (errorMessage) {
      tx.errorMessage = errorMessage;
    }
    return this.transactionRepository.save(tx);
  }

  async findBySrcTxHash(srcTxHash: string): Promise<Transaction | null> {
    return this.transactionRepository.findOneBy({
      srcTxHash: srcTxHash.toLowerCase(),
    });
  }

  async findPending(): Promise<Transaction[]> {
    return this.transactionRepository.findBy({
      status: TransactionStatus.PENDING,
    });
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
