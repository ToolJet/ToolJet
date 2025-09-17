import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SelfhostCustomers } from './selfhost_customers.entity';
import { WalletType } from './organizations_ai_feature.entity';
import { TransactionStatus, TransactionType } from './organization_ai_credit_history.entity';

@Entity('selfhost_customers_ai_credit_history')
export class SelfhostCustomersAiCreditHistory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'amount', type: 'int', nullable: true })
  amount: number | null;

  @Column({ name: 'ai_credits', type: 'numeric', precision: 12, scale: 2, default: 0 })
  aiCredits: number;

  @Column({ name: 'operation', type: 'varchar', length: 50 })
  operation: string;

  @Column({
    name: 'wallet_type',
    type: 'enum',
    enum: WalletType,
  })
  walletType: WalletType;

  @Column({
    name: 'transaction_type',
    type: 'enum',
    enum: TransactionType,
  })
  transactionType: TransactionType;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TransactionStatus,
  })
  status: TransactionStatus;

  @ManyToOne(() => SelfhostCustomers, (customer) => customer.aiCreditHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'selfhost_customer_id' })
  selfhostCustomer: SelfhostCustomers;

  @Column({ name: 'selfhost_customer_id', type: 'uuid' })
  selfhostCustomerId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
