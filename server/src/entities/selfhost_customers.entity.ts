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
import { Metadata } from './metadata.entity';

@Entity('selfhost_customers')
export class SelfhostCustomers extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'email', type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'license_key', type: 'varchar', length: 10000 })
  licenseKey: string;

  @Column({ name: 'host_name', type: 'varchar', length: 255 })
  hostname: string;

  @Column({ name: 'subpath', type: 'varchar', length: 255 })
  subpath: string;

  @Column({ name: 'license_type', type: 'varchar', length: 255 })
  licenseType: string;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate: Date;

  @Column({ name: 'users', type: 'int' })
  users: number;

  @Column({ name: 'builders', type: 'int' })
  builders: number;

  @Column({ name: 'end_users', type: 'int' })
  endUsers: number;

  @Column({ name: 'super_admin', type: 'int' })
  superAdmin: number;

  @Column({ name: 'license_details', type: 'json' })
  licenseDetails: any;

  @Column({ name: 'other_data', type: 'json' })
  otherData: any;

  @OneToOne(() => Metadata, (metadata) => metadata.id)
  @JoinColumn({ name: 'metadata_id' })
  metadata: Metadata;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
