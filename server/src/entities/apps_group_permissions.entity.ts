import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GranularPermissions } from './granular_permissions.entity';
import { GroupApps } from './group_apps.entity';
import { APP_TYPES } from '@modules/apps/constants';

@Entity({ name: 'apps_group_permissions' })
export class AppsGroupPermissions extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'granular_permission_id', unique: true })
  granularPermissionId: string;

  @Column({
    name: 'app_type',
    type: 'enum',
    enum: APP_TYPES,
  })
  appType: APP_TYPES;

  @Column({ name: 'can_edit', nullable: false, default: false })
  canEdit: boolean;

  @Column({ name: 'can_view', nullable: false, default: false })
  canView: boolean;

  @Column({ name: 'hide_from_dashboard', nullable: false, default: false })
  hideFromDashboard: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => GranularPermissions, (granularPermission) => granularPermission.id)
  @JoinColumn({ name: 'granular_permission_id' })
  granularPermissions: GranularPermissions;

  @OneToMany(() => GroupApps, (groupApps) => groupApps.appsPermissions, { onDelete: 'CASCADE' })
  groupApps: GroupApps[];
}
