import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('custom_domains')
export class CustomDomain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', unique: true })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255, unique: true })
  domain: string;

  @Column({ name: 'provider_hostname_id', type: 'varchar', length: 255, nullable: true })
  providerHostnameId: string;

  @Column({
    type: 'enum',
    enum: ['pending_verification', 'pending_ssl', 'active', 'failed', 'deleted'],
    default: 'pending_verification',
  })
  status: string;

  @Column({ name: 'ssl_status', type: 'varchar', length: 50, nullable: true })
  sslStatus: string;

  @Column({ name: 'verification_errors', type: 'jsonb', nullable: true })
  verificationErrors: Record<string, any>;

  @Column({ name: 'cname_target', type: 'varchar', length: 255, nullable: true })
  cnameTarget: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    name: 'updated_at',
  })
  updatedAt: Date;
}
