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
import { UserGroupPermission } from './user_group_permission.entity';
import { AppGroupPermission } from './app_group_permission.entity';
import { User } from './user.entity';

@Entity({ name: 'user_app_group_permissions' })
export class UserAppGroupPermission extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_id' })
  appId: string;

  @Column({ name: 'app_group_permission_id' })
  appGroupPermissionsId: string;

  @Column({ name: 'user_group_permission_id' })
  userGroupPermissionId: string;

  @Column({ default: false })
  create: boolean;

  @Column({ default: false })
  read: boolean;

  @Column({ default: false })
  update: boolean;

  @Column({ default: false })
  delete: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.userAppGroupPermissions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => UserGroupPermission, (userGroupPermission) => userGroupPermission.id)
  @JoinColumn({ name: 'user_group_permission_id' })
  userGroupPermission: UserGroupPermission;

  @ManyToOne(() => AppGroupPermission, (appGroupPermission) => appGroupPermission.id)
  @JoinColumn({ name: 'app_group_permission_id' })
  appGroupPermission: AppGroupPermission;
}
