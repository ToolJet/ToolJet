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
import { User } from './user.entity';

/**
 * ███████████████████████████████████████████████████████████████████████████████
 * █                                                                             █
 * █                               DEPRECATED                                    █
 * █                                                                             █
 * █  This file is deprecated and will be removed in a future version.           █
 * █  Please use the new implementation in `group_users.entity.ts` instead.      █
 * █                                                                             █
 * █                                                                             █
 * ███████████████████████████████████████████████████████████████████████████████
 */

@Entity({ name: 'user_group_permissions' })
export class UserGroupPermission extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'group_permission_id' })
  groupPermissionId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

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
 * █  Please use the new implementation in `group_users.entity.ts` instead.      █
 * █                                                                             █
 * █                                                                             █
 * ███████████████████████████████████████████████████████████████████████████████
 */
