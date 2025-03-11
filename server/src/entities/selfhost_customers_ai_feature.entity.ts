import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { SelfhostCustomers } from './selfhost_customers.entity';

@Entity('selfhost_customers_ai_feature')
export class SelfhostCustomersAiFeature extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => SelfhostCustomers, (customer) => customer.id)
  @JoinColumn({ name: 'selfhost_customer_id' })
  selfhostCustomer: SelfhostCustomers;

  @Column({ name: 'selfhost_customer_id', type: 'uuid' })
  selfhostCustomerId: number;

  @Column({ name: 'api_key', type: 'varchar', length: 255 })
  apiKey: string;

  @Column({ name: 'balance', type: 'int' })
  balance: number;

  @Column({ name: 'renew_date', type: 'timestamp' })
  renewDate: Date;

  @Column({ name: 'ai_credit_fixed', type: 'int' })
  aiCreditFixed: number;

  @Column({ name: 'ai_credit_multiplier', type: 'int' })
  aiCreditMultiplier: number;

  @Column({ name: 'balance_renewed_date', type: 'timestamp' })
  balanceRenewedDate: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
