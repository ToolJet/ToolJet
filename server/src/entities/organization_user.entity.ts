import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
  Unique,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity({ name: 'organization_users' })
@Unique(['userId', 'organizationId'])
export class OrganizationUser extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  role: string;

  @Column({ type: 'enum', enumName: 'status', enum: ['invited', 'active', 'archived'] })
  status: string;

  @Column({ type: 'enum', enumName: 'source', enum: ['signup', 'invite'] })
  source: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'invitation_token' })
  invitationToken: string;

  // Last Git branch this user had active in this workspace. Restored on login so the user
  // returns to the branch they were working on instead of the default branch. Nullable.
  @Column({ name: 'last_branch_id', type: 'uuid', nullable: true })
  lastBranchId?: string | null;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
