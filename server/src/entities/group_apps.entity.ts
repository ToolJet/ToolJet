import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { App } from './app.entity';
import { AppsGroupPermissions } from './apps_group_permissions.entity';

@Entity({ name: 'group_apps' })
@Unique(['appId', 'appsGroupPermissionsId'])
export class GroupApps extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_id' })
  appId: string;

  @Column({ name: 'apps_group_permissions_id' })
  appsGroupPermissionsId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => App, (app) => app.id)
  @JoinColumn({ name: 'app_id' })
  app: App;

  @ManyToOne(() => AppsGroupPermissions, (appsPermissions) => appsPermissions.id)
  @JoinColumn({ name: 'apps_group_permissions_id' })
  appsPermissions: AppsGroupPermissions;
}
