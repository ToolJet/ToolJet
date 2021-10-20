import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { App } from './app.entity';
import { AppGroupPermission } from './app_group_permission.entity';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { UserGroupPermission } from './user_group_permission.entity';

@Entity({ name: 'group_permissions' })
export class GroupPermission extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column()
  group: string;

  @Column({ default: false })
  app_create: boolean;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => UserGroupPermission, (userGroupPermission) => userGroupPermission.groupPermission)
  userGroupPermission: UserGroupPermission[];

  @OneToMany(() => AppGroupPermission, (appGroupPermission) => appGroupPermission.groupPermission)
  appGroupPermission: AppGroupPermission[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'user_group_permissions',
    joinColumn: {
      name: 'group_permission_id',
    },
    inverseJoinColumn: {
      name: 'user_id',
    },
  })
  users: Promise<User[]>;

  @ManyToMany(() => App)
  @JoinTable({
    name: 'app_group_permissions',
    joinColumn: {
      name: 'group_permission_id',
    },
    inverseJoinColumn: {
      name: 'app_id',
    },
  })
  apps: Promise<App[]>;
}
