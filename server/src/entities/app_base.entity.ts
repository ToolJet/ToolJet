import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  BaseEntity,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { AppVersion } from './app_version.entity';
import { GroupPermission } from './group_permission.entity';
import { AppGroupPermission } from './app_group_permission.entity';

@Entity({ name: 'apps' })
export class AppBase extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'slug', unique: true })
  slug: string;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @Column({ name: 'is_maintenance_on', default: false })
  isMaintenanceOn: boolean;

  @Column({ name: 'icon' })
  icon: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'current_version_id' })
  currentVersionId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => AppVersion, (appVersion) => appVersion.app, {
    onDelete: 'CASCADE',
  })
  appVersions: AppVersion[];

  @ManyToMany(() => GroupPermission)
  @JoinTable({
    name: 'app_group_permissions',
    joinColumn: {
      name: 'app_id',
    },
    inverseJoinColumn: {
      name: 'group_permission_id',
    },
  })
  groupPermissions: GroupPermission[];

  @OneToMany(() => AppGroupPermission, (appGroupPermission) => appGroupPermission.app, { onDelete: 'CASCADE' })
  appGroupPermissions: AppGroupPermission[];
}
