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

  @Column({ name: 'invitation_token_expiry', type: 'timestamptz', nullable: true, default: null })
  invitationTokenExpiry: Date | null;

  /**
   * The builder's chosen LLM provider for this workspace, or null if they never picked one.
   *
   * Lives here rather than in a table of its own because membership already is the
   * user-and-workspace pair the preference is keyed on, unique constraint included.
   * Only meaningful on ToolJet-managed AI; BYOK and self-hosted take the admin's
   * provider from organization_ai_keys and ignore this.
   */
  @Column({ name: 'llm_provider', nullable: true })
  llmProvider: string;

  @Column({ name: 'llm_model', nullable: true })
  llmModel: string;

  @Column({ name: 'llm_model_context_window', nullable: true })
  llmModelContextWindow: number;

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
