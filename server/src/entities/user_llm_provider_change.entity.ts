import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { AiConversation } from './ai_conversation.entity';

/**
 * Append-only log of a builder's LLM switches — provider, model, or both.
 *
 * Conversations do not store a system message per switch. Instead the
 * conversation read path interleaves a synthetic system message for every change
 * recorded here that falls between two persisted messages, so the divider lands
 * chronologically in the conversation the switch was made in.
 *
 * Named for providers only because it predates per-chat model selection; renaming the table
 * would cost a migration and two index rebuilds for no behavioural gain.
 */
@Entity('user_llm_provider_changes')
@Index('user_llm_provider_changes_user_id_created_at_idx', ['userId', 'createdAt'])
@Index('user_llm_provider_changes_conversation_id_created_at_idx', ['conversationId', 'createdAt'])
export class UserLlmProviderChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  /**
   * The conversation the switch was made in. A switch now applies to one chat, so the
   * divider is rendered only in that chat.
   *
   * Null on rows written before per-conversation selection, when the preference really was
   * workspace-wide; those still render in every conversation so old transcripts read correctly.
   */
  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId: string | null;

  /** Null when the builder had never set a preference before this switch. */
  @Column({ name: 'from_provider', type: 'varchar', length: 50, nullable: true })
  fromProvider: string | null;

  @Column({ name: 'to_provider', type: 'varchar', length: 50 })
  toProvider: string;

  /**
   * The model on each side of the switch. Null means "Auto" — the provider running its own
   * default — not "unknown", so a move to or from Auto is itself a recorded change.
   *
   * Both are null on rows predating per-chat model selection, which reads correctly: those were
   * provider-only switches.
   */
  @Column({ name: 'from_model', type: 'varchar', length: 200, nullable: true })
  fromModel: string | null;

  @Column({ name: 'to_model', type: 'varchar', length: 200, nullable: true })
  toModel: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => AiConversation, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'conversation_id' })
  conversation: AiConversation;
}
