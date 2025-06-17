import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  BaseEntity,
  OneToOne,
} from 'typeorm';
import { SSOConfigs } from './sso_config.entity';
import { OrganizationUser } from './organization_user.entity';
import { InternalTable } from './internal_table.entity';
import { AppEnvironment } from './app_environments.entity';
import { OrganizationGitSync } from './organization_git_sync.entity';
import { OrganizationThemes } from './organization_themes.entity';
import { GroupPermissions } from './group_permissions.entity';
import { GroupPermission } from './group_permission.entity';
import { UserDetails } from './user_details.entity';
import { OrganizationTjdbConfigurations } from './organization_tjdb_configurations.entity';
import { WhiteLabelling } from './white_labelling.entity';

@Entity({ name: 'organizations' })
export class Organization extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', unique: true })
  name: string;

  @Column({ name: 'slug', unique: true })
  slug: string;

  @Column({ name: 'domain' })
  domain: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'enable_sign_up' })
  enableSignUp: boolean;

  @Column({ name: 'inherit_sso' })
  inheritSSO: boolean;

  @Column({ name: 'automatic_sso_login' })
  automaticSsoLogin: boolean;

  @Column({
    type: 'enum',
    enumName: 'workspace_status',
    name: 'status',
    enum: ['active', 'archived'],
    default: 'active',
  })
  status: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => GroupPermissions, (groupPermissions) => groupPermissions.organization, { onDelete: 'CASCADE' })
  permissionGroups: GroupPermissions[];

  //Depreciated
  @OneToMany(() => GroupPermission, (groupPermission) => groupPermission.organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  groupPermissions: GroupPermission[];

  @OneToMany(() => SSOConfigs, (ssoConfigs) => ssoConfigs.organization, { cascade: ['insert'] })
  ssoConfigs: SSOConfigs[];

  @OneToOne(() => OrganizationGitSync, (organizationGitSync) => organizationGitSync.organization, {
    onDelete: 'CASCADE',
  })
  organizationGitSync: OrganizationGitSync;

  @OneToMany(() => OrganizationUser, (organizationUser) => organizationUser.organization)
  organizationUsers: OrganizationUser[];

  @OneToMany(() => AppEnvironment, (appEnvironment) => appEnvironment.organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  appEnvironments: AppEnvironment[];

  @OneToOne(() => WhiteLabelling, (whiteLabelling) => whiteLabelling.organization, { onDelete: 'CASCADE' })
  whiteLabelling: WhiteLabelling;

  @OneToMany(() => InternalTable, (internalTable) => internalTable.organization)
  internalTable: InternalTable[];

  @OneToMany(() => OrganizationThemes, (organizationTheme) => organizationTheme.organization)
  organizationThemes: OrganizationThemes[];

  @OneToMany(() => UserDetails, (userDetails) => userDetails.organization)
  userDetails: UserDetails[];

  @OneToMany(
    () => OrganizationTjdbConfigurations,
    (organizationTjdbConfiguration) => organizationTjdbConfiguration.organizationId
  )
  organizationTjdbConfigurations: OrganizationTjdbConfigurations[];
}
