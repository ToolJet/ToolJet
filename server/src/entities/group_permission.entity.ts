import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { App } from './app.entity';
import { AppGroupPermission } from './app_group_permission.entity';
import { DataSource } from './data_source.entity';
import { DataSourceGroupPermission } from './data_source_group_permission.entity';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { UserGroupPermission } from './user_group_permission.entity';

@Entity({ name: 'group_permissions' })
export class GroupPermission extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column()
  group: string;

  @Column({ name: 'app_create', default: false })
  appCreate: boolean;

  @Column({ name: 'app_delete', default: false })
  appDelete: boolean;

  @Column({ name: 'folder_create', default: false })
  folderCreate: boolean;

  @Column({ name: 'org_environment_variable_create', default: false })
  orgEnvironmentVariableCreate: boolean;

  @Column({ name: 'org_environment_variable_update', default: false })
  orgEnvironmentVariableUpdate: boolean;

  @Column({ name: 'org_environment_variable_delete', default: false })
  orgEnvironmentVariableDelete: boolean;

  @Column({ name: 'org_environment_constant_create', default: false })
  orgEnvironmentConstantCreate: boolean;

  @Column({ name: 'org_environment_constant_delete', default: false })
  orgEnvironmentConstantDelete: boolean;

  @Column({ name: 'folder_delete', default: false })
  folderDelete: boolean;

  @Column({ name: 'folder_update', default: false })
  folderUpdate: boolean;

  @Column({ name: 'data_source_create', default: false })
  dataSourceCreate: boolean;

  @Column({ name: 'data_source_delete', default: false })
  dataSourceDelete: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => UserGroupPermission, (userGroupPermission) => userGroupPermission.groupPermission)
  userGroupPermission: UserGroupPermission[];

  @OneToMany(() => AppGroupPermission, (appGroupPermission) => appGroupPermission.groupPermission)
  appGroupPermission: AppGroupPermission[];

  @OneToMany(() => DataSourceGroupPermission, (dataSourceGroupPermission) => dataSourceGroupPermission.groupPermission)
  dataSourceGroupPermission: AppGroupPermission[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'user_group_permissions',
    joinColumn: {
      name: 'group_permission_id',
    },
    inverseJoinColumn: {
      name: 'user_id',
    },
  })
  users: Promise<User[]>;

  @ManyToMany(() => App)
  @JoinTable({
    name: 'app_group_permissions',
    joinColumn: {
      name: 'group_permission_id',
    },
    inverseJoinColumn: {
      name: 'app_id',
    },
  })
  apps: Promise<App[]>;

  @ManyToMany(() => DataSource)
  @JoinTable({
    name: 'data_source_group_permissions',
    joinColumn: {
      name: 'group_permission_id',
    },
    inverseJoinColumn: {
      name: 'data_source_id',
    },
  })
  dataSources: Promise<DataSource[]>;
}
