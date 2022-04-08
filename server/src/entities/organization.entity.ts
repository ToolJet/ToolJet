import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  BaseEntity,
} from 'typeorm';
import { GroupPermission } from './group_permission.entity';
import { SSOConfigs } from './sso_config.entity';
import { OrganizationUser } from './organization_user.entity';

@Entity({ name: 'organizations' })
export class Organization extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'domain' })
  domain: string;

  @Column({ name: 'enable_sign_up' })
  enableSignUp: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => GroupPermission, (groupPermission) => groupPermission.organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  groupPermissions: GroupPermission[];

  @OneToMany(() => SSOConfigs, (ssoConfigs) => ssoConfigs.organization, { cascade: ['insert'] })
  ssoConfigs: SSOConfigs[];

  @OneToMany(() => OrganizationUser, (organizationUser) => organizationUser.organization)
  organizationUsers: OrganizationUser[];
}
