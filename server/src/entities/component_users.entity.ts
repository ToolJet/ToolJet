import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { ComponentPermission } from './component_permissions.entity';
import { GroupPermissions } from './group_permissions.entity';

@Entity('component_users')
export class ComponentUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'component_permissions_id', type: 'uuid' })
  componentPermissionsId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'permission_groups_id', type: 'uuid', nullable: true })
  permissionGroupsId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ComponentPermission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'component_permissions_id' })
  componentPermission: ComponentPermission;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => GroupPermissions, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'permission_groups_id' })
  permissionGroup: GroupPermissions;
}
