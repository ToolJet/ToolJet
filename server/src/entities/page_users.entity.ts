import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { PagePermission } from './page_permissions.entity';
import { GroupPermissions } from './group_permissions.entity';

@Entity('page_users')
export class PageUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'page_permissions_id', type: 'uuid' })
  pagePermissionsId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'permission_groups_id', type: 'uuid', nullable: true })
  permissionGroupsId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => PagePermission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_permissions_id' })
  pagePermission: PagePermission;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => GroupPermissions, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'permission_groups_id' })
  permissionGroup: GroupPermissions;
}
