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
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { User } from 'src/entities/user.entity';
import { Organization } from 'src/entities/organization.entity';

@Entity({ name: 'group_admins' })
@Unique(['userId', 'groupId'])
export class GroupAdmin extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: false })
  userId: string;

  @Column({ name: 'group_id', nullable: false })
  groupId: string;

  @Column({ name: 'organization_id', nullable: false })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => GroupPermissions, (group) => group.id)
  @JoinColumn({ name: 'group_id' })
  group: GroupPermissions;
}
