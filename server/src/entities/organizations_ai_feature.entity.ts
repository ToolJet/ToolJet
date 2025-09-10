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

export enum WalletType {
  RECURRING = 'recurring',
  TOPUP = 'topup',
  FIXED = 'fixed',
}

@Entity('organizations_ai_feature')
export class OrganizationsAiFeature extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, (organization) => organization.aiFeatures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'balance', type: 'numeric', precision: 12, scale: 2 })
  balance: number;

  // renamed from renew_date -> expiry_date (nullable)
  @Column({ name: 'expiry_date', type: 'timestamp', nullable: true })
  expiryDate: Date | null;

  @Column({
    name: 'wallet_type',
    type: 'enum',
    enum: WalletType,
  })
  walletType: WalletType;

  @Column({ name: 'balance_renewed_date', type: 'timestamp' })
  balanceRenewedDate: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
