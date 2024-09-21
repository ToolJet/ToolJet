import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ResourceType } from '@modules/user_resource_permissions/constants/granular-permissions.constant';
import { GroupPermissions } from './group_permissions.entity';
import { AppsGroupPermissions } from './apps_group_permissions.entity';

@Entity({ name: 'granular_permissions' })
export class GranularPermissions extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id' })
  groupId: string;

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'type', nullable: false, type: 'enum', enum: ResourceType })
  type: ResourceType;

  @Column({ name: 'is_all', nullable: false, default: true })
  isAll: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => GroupPermissions, (group) => group.id)
  @JoinColumn({ name: 'group_id' })
  group: GroupPermissions;

  @OneToOne(() => AppsGroupPermissions, (appsGroupPermission) => appsGroupPermission.granularPermissions, {
    onDelete: 'CASCADE',
  })
  appsGroupPermissions: AppsGroupPermissions;
}
