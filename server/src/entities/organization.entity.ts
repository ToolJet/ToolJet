import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { GroupPermission } from './group_permission.entity';
import { User } from './user.entity';

@Entity({ name: 'organizations' })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'domain' })
  domain: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => GroupPermission, (groupPermission) => groupPermission.organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  groupPermissions: GroupPermission[];

  @OneToMany(() => User, (user) => user.organization)
  @JoinColumn({ name: 'organization_id' })
  users: User[];
}
