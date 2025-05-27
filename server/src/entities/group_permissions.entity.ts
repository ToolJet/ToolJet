import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { GroupUsers } from './group_users.entity';
import { GranularPermissions } from './granular_permissions.entity';
import { GROUP_PERMISSIONS_TYPE } from '@modules/group-permissions/constants';
import { PageUser } from './page_users.entity';

@Entity({ name: 'permission_groups' })
export class GroupPermissions extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', nullable: false })
  organizationId: string;

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'type', nullable: false, type: 'enum', enum: GROUP_PERMISSIONS_TYPE })
  type: GROUP_PERMISSIONS_TYPE;

  @Column({ name: 'app_create', default: false })
  appCreate: boolean;

  @Column({ name: 'app_delete', default: false })
  appDelete: boolean;

  @Column({ name: 'folder_crud', default: false })
  folderCRUD: boolean;

  @Column({ name: 'org_constant_crud', default: false })
  orgConstantCRUD: boolean;

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

  @OneToMany(() => GroupUsers, (groupUsers) => groupUsers.group, { onDelete: 'CASCADE' })
  groupUsers: GroupUsers[];

  @OneToMany(() => GranularPermissions, (granularPermissions) => granularPermissions.group, { onDelete: 'CASCADE' })
  groupGranularPermissions: GranularPermissions[];

  @OneToMany(() => PageUser, (pageUser) => pageUser.permissionGroup)
  pageUsers: PageUser[];

  disabled?: boolean;
}
