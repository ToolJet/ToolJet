import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

/**
 * Append-only log of a builder's LLM provider switches.
 *
 * Conversations do not store a system message per switch. Instead the
 * conversation read path interleaves a synthetic system message for every change
 * recorded here that falls between two persisted messages, so the divider lands
 * chronologically in every conversation the builder already had open.
 */
@Entity('user_llm_provider_changes')
@Index('user_llm_provider_changes_user_id_created_at_idx', ['userId', 'createdAt'])
export class UserLlmProviderChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  /** Null when the builder had never set a preference before this switch. */
  @Column({ name: 'from_provider', type: 'varchar', length: 50, nullable: true })
  fromProvider: string | null;

  @Column({ name: 'to_provider', type: 'varchar', length: 50 })
  toProvider: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
