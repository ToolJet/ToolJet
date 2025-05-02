import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { MODULES } from '@modules/app/constants/modules';

@Entity({ name: 'audit_logs' })
export class AuditLog extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'resource_id' })
  resourceId: string;

  @Column({ name: 'resource_name' })
  resourceName: string;

  @Column({ name: 'resource_type', type: 'enum', enum: MODULES })
  resourceType: MODULES;

  @Column('simple-json', { name: 'resource_data' })
  resourceData;

  @Column({ name: 'action_type' })
  actionType: string;

  @Column({ name: 'ip_address' })
  ipAddress: string;

  @Column('simple-json', { name: 'metadata' })
  metadata;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
