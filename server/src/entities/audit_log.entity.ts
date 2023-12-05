import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export enum ActionTypes {
  TRIAL_GENERATION_FOR_WORKSPACE = 'TRIAL_GENERATION_FOR_WORKSPACE',

  USER_LOGIN = 'USER_LOGIN',
  USER_SIGNUP = 'USER_SIGNUP',
  USER_INVITE = 'USER_INVITE',
  USER_INVITE_REDEEM = 'USER_INVITE_REDEEM',

  APP_CREATE = 'APP_CREATE',
  APP_UPDATE = 'APP_UPDATE',
  APP_VIEW = 'APP_VIEW',
  APP_DELETE = 'APP_DELETE',
  APP_IMPORT = 'APP_IMPORT',
  APP_EXPORT = 'APP_EXPORT',
  APP_CLONE = 'APP_CLONE',

  DATA_QUERY_RUN = 'DATA_QUERY_RUN',

  GROUP_PERMISSION_CREATE = 'GROUP_PERMISSION_CREATE',
  GROUP_PERMISSION_UPDATE = 'GROUP_PERMISSION_UPDATE',
  GROUP_PERMISSION_DELETE = 'GROUP_PERMISSION_DELETE',
  APP_GROUP_PERMISSION_UPDATE = 'APP_GROUP_PERMISSION_UPDATE',
}

export enum ResourceTypes {
  USER = 'USER',
  APP = 'APP',
  DATA_QUERY = 'DATA_QUERY',
  GROUP_PERMISSION = 'GROUP_PERMISSION',
  APP_GROUP_PERMISSION = 'APP_GROUP_PERMISSION',
}

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

  @Column({ name: 'resource_type', type: 'enum', enum: ResourceTypes })
  resourceType: ResourceTypes;

  @Column({ name: 'action_type', type: 'enum', enum: ActionTypes })
  actionType: ActionTypes;

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
