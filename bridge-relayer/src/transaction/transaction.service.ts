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

  async create(data: {
    srcChain: 'sepolia' | 'amoy';
    srcTxHash: string;
    sender: string;
    amount: string;
    eventTxHash: string;
  }): Promise<Transaction> {
    const existing = await this.findBySrcTxHash(data.srcTxHash);
    if (existing) {
      return existing;
    }

    const tx = this.transactionRepository.create({
      ...data,
      srcTxHash: data.srcTxHash.toLowerCase(),
      sender: data.sender.toLowerCase(),
      eventTxHash: data.eventTxHash.toLowerCase(),
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
    if (errorMessage !== undefined) {
      tx.errorMessage = errorMessage;
    }
    return this.transactionRepository.save(tx);
  }

  async findBySrcTxHash(srcTxHash: string): Promise<Transaction | null> {
    return this.transactionRepository.findOneBy({
      srcTxHash: srcTxHash.toLowerCase(),
    });
  }

  async findBySender(sender: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { sender: sender.toLowerCase() },
      order: { createdAt: 'DESC' },
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
      take: 50,
    });
  }
}
