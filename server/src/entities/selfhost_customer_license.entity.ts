import {
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  BaseEntity,
  Entity,
} from 'typeorm';

@Unique(['email'])
@Entity({ name: 'selfhost_customer_licenses' })
export class SelfhostCustomerLicense extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'license_key' })
  licenseKey: string;

  @Column({ name: 'company_name' })
  companyName: string;

  @Column({ name: 'hostname' })
  hostname: string;

  @Column({ name: 'subpath' })
  subpath: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'other_data' })
  otherData: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
}
