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

@Entity({ name: 'app_group_permissions' })
export class AppGroupPermission extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_id' })
  appId: string;

  @Column({ name: 'group_permission_id' })
  groupPermissionsId: string;

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
