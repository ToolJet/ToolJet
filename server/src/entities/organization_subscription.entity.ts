import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { OrganizationSubscriptionInvoice } from './organization_subscription_invoice.entity';

@Entity({ name: 'organization_subscriptions' })
export class OrganizationSubscription {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'subscription_id', unique: true })
  subscriptionId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'company_name' })
  companyName: string;

  @Column({ name: 'email' })
  email: string;

  @Column({
    type: 'enum',
    name: 'status',
    enumName: 'subscription_status',
    nullable: false,
    enum: ['active', 'incomplete', 'incomplete_expired', 'trialing', 'past_due', 'canceled', 'unpaid'],
  })
  status: string;

  @Column({ name: 'is_license_generated', default: false })
  isLicenseGenerated: boolean;

  @Column({
    type: 'enum',
    enumName: 'subscription_type',
    name: 'subscription_type',
    nullable: false,
    enum: ['monthly', 'yearly'],
  })
  subscriptionType: string;

  @Column({
    type: 'enum',
    enumName: 'stripe_mode',
    name: 'mode',
    nullable: false,
    enum: ['payment', 'setup', 'subscription'],
  })
  mode: string;

  @Column({ name: 'no_of_editors' })
  noOfEditors: number;

  @Column({ name: 'no_of_readers' })
  noOfReaders: number;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(
    () => OrganizationSubscriptionInvoice,
    (organizationSubscriptionInvoice: OrganizationSubscriptionInvoice) =>
      organizationSubscriptionInvoice.organizationSubscription
  )
  organizationSubscriptionInvoices: OrganizationSubscriptionInvoice[];
}
