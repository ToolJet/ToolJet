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

export enum WalletTypeSelfhost {
  RECURRING = 'recurring',
  TOPUP = 'topup',
  FIXED = 'fixed',
}

@Entity('selfhost_customers_ai_feature')
export class SelfhostCustomersAiFeature extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SelfhostCustomers, (customer) => customer.aiFeatures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'selfhost_customer_id' })
  selfhostCustomer: SelfhostCustomers;

  @Column({ name: 'selfhost_customer_id', type: 'uuid' })
  selfhostCustomerId: string;

  @Column({ name: 'api_key', type: 'varchar', length: 255 })
  apiKey: string;

  @Column({ name: 'balance', type: 'numeric', precision: 12, scale: 2 })
  balance: number;

  // renamed from renew_date -> expiry_date (nullable)
  @Column({ name: 'expiry_date', type: 'timestamp', nullable: true })
  expiryDate: Date | null;

  @Column({
    name: 'wallet_type',
    type: 'enum',
    enum: WalletTypeSelfhost,
  })
  walletType: WalletTypeSelfhost;

  @Column({
    name: 'total_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({ name: 'balance_renewed_date', type: 'timestamp' })
  balanceRenewedDate: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
