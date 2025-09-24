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
import { Organization } from './organization.entity';
import { WalletType } from './organizations_ai_feature.entity';

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum TransactionStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
}

@Entity('organization_ai_credit_history')
export class OrganizationAiCreditHistory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
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

  @ManyToOne(() => Organization, (organization) => organization.aiCreditHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
