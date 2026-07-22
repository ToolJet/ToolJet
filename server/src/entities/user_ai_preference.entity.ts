import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

/**
 * A builder's own LLM provider preference, scoped to a workspace.
 *
 * Only consulted on ToolJet managed (AI plan `credits`); BYOK and self-hosted AI
 * are pinned to the provider the admin configured on `organization_ai_keys` /
 * instance settings, so no row is ever written for those plans.
 */
@Entity('user_ai_preferences')
@Unique('user_ai_preferences_user_id_organization_id_unique', ['userId', 'organizationId'])
export class UserAiPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'provider', type: 'varchar', length: 50 })
  provider: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
