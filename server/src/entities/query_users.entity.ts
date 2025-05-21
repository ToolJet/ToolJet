import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { QueryPermission } from './query_permissions.entity';
import { GroupPermissions } from './group_permissions.entity';

@Entity('query_users')
export class QueryUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'query_permissions_id', type: 'uuid' })
  queryPermissionsId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'permission_groups_id', type: 'uuid', nullable: true })
  permissionGroupsId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => QueryPermission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'query_permissions_id' })
  queryPermission: QueryPermission;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => GroupPermissions, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'permission_groups_id' })
  permissionGroup: GroupPermissions;
}
