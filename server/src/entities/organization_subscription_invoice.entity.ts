import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { OrganizationSubscription } from './organization_subscription.entity';

@Entity({ name: 'organization_subscription_invoices' })
export class OrganizationSubscriptionInvoice {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'organization_subscription_id' })
  organizationSubscriptionId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'invoice_id', unique: true })
  invoiceId: string;

  @Column({ name: 'invoice_link' })
  invoiceLink: string;

  @Column({ name: 'invoice_due' })
  invoiceDue: Date;

  @Column({
    type: 'enum',
    name: 'status',
    enumName: 'invoice_status',
    nullable: false,
    enum: ['draft', 'open', 'paid', 'uncollectible', 'void', 'failed'],
  })
  status: string;

  @Column({ name: 'is_viewed', default: false })
  isViewed: boolean;

  @Column({
    type: 'enum',
    enumName: 'invoice_type',
    name: 'type',
    nullable: false,
    enum: ['recurring', 'subscription'],
  })
  type: string;

  @Column({ name: 'paid_date' })
  paidDate: Date;

  @Column({ name: 'current_period_start' })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end' })
  currentPeriodEnd: Date;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => OrganizationSubscription, (organizationSubscription) => organizationSubscription.id)
  @JoinColumn({ name: 'organization_subscription_id' })
  organizationSubscription: OrganizationSubscription;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
