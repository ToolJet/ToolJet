import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'organizations_payments' })
export class OrganizationPayment {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @Column({ name: 'invoice_id' })
  invoiceId: string;

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
}
