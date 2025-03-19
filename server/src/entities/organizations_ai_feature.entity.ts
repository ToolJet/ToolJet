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
import { Organization } from './organization.entity';

@Entity('organizations_ai_feature')
export class OrganizationsAiFeature extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

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
