import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupPermission } from './group_permission.entity';
import { App } from './app.entity';

/**
 * ███████████████████████████████████████████████████████████████████████████████
 * █                                                                             █
 * █                               DEPRECATED                                    █
 * █                                                                             █
 * █  This file is deprecated and will be removed in a future version.           █
 * █  Please use the new implementation in `group_apps.entity.ts` instead.       █
 * █                                                                             █
 * █                                                                             █
 * ███████████████████████████████████████████████████████████████████████████████
 */

@Entity({ name: 'app_group_permissions' })
export class AppGroupPermission extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_id' })
  appId: string;

  @Column({ name: 'group_permission_id' })
  groupPermissionId: string;

  @Column({ default: false })
  read: boolean;

  @Column({ default: false })
  update: boolean;

  @Column({ default: false })
  delete: boolean;

  @Column({ default: false, name: 'hide_from_dashboard' })
  hideFromDashboard: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => App, (app) => app.id)
  @JoinColumn({ name: 'app_id' })
  app: App;

  @ManyToOne(() => GroupPermission, (groupPermission) => groupPermission.id)
  @JoinColumn({ name: 'group_permission_id' })
  groupPermission: GroupPermission;
}

/**
 * ███████████████████████████████████████████████████████████████████████████████
 * █                                                                             █
 * █                               DEPRECATED                                    █
 * █                                                                             █
 * █  This file is deprecated and will be removed in a future version.           █
 * █  Please use the new implementation in `group_apps.entity.ts` instead.       █
 * █                                                                             █
 * █                                                                             █
 * ███████████████████████████████████████████████████████████████████████████████
 */
