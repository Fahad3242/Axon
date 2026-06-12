import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMING = 'CONFIRMING',
  RELAYING = 'RELAYING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  srcChain: string;

  @Column({ unique: true })
  srcTxHash: string;

  @Column({ nullable: true })
  destTxHash: string;

  @Column()
  sender: string;

  @Column()
  amount: string;

  @Column()
  eventTxHash: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
