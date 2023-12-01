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

@Entity({ name: 'organizations_payments' })
export class OrganizationPayment {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @Column({ name: 'invoice_id', unique: true })
  invoiceId: string;

  @Column({ name: 'company_name' })
  companyName: string;

  @Column({ name: 'email' })
  email: string;

  @Column({
    type: 'enum',
    name: 'payment_status',
    enumName: 'stripe_payment_status',
    nullable: false,
    enum: ['success', 'failed'],
  })
  paymentStatus: string;

  @Column({ name: 'is_license_generated', default: false })
  isLicenseGenerated: boolean;

  @Column({ name: 'invoice_paid_date' })
  invoicePaidDate: Date;

  @Column({
    type: 'enum',
    enumName: 'cloud_subscription_type',
    name: 'subscription_type',
    nullable: false,
    enum: ['monthly', 'yearly'],
  })
  subscriptionType: string;

  @Column({
    type: 'enum',
    enumName: 'stripe_invoice_type',
    name: 'invoice_type',
    nullable: false,
    enum: ['recurring', 'subscription'],
  })
  invoiceType: string;

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
}
