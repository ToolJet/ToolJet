import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { AiConversationMessage } from './ai_conversation_message.entity';
import { App } from './app.entity';

@Entity('ai_conversations')
export class AiConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @Column({ type: 'text', nullable: true })
  preview: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'app_id' })
  appId: string;

  @Column({ type: 'json', nullable: true, default: {} })
  metadata: Record<string, any>;

  /**
   * The LLM this chat runs on, pinned when the conversation is created and rewritten
   * whenever the builder switches provider with this chat open.
   *
   * Null means the chat predates per-conversation selection; it resolves to the builder's
   * workspace default (organization_users.llm_provider) and is pinned on first touch.
   */
  @Column({ name: 'llm_provider', nullable: true })
  llmProvider: string;

  /** The model chosen under `llmProvider`. Null = that provider's default ("Auto"). */
  @Column({ name: 'llm_model', nullable: true })
  llmModel: string;

  @Column({ name: 'llm_model_context_window', nullable: true })
  llmModelContextWindow: number;

  @Column({
    type: 'enum',
    enum: ['generate', 'learn'],
    nullable: false,
    name: 'conversation_type',
  })
  conversationType: 'generate' | 'learn';

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.aiConversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
  // APP can have multiple conversations, and conversation belongs to user.
  @ManyToOne(() => App, (app) => app.aiConversations)
  @JoinColumn({ name: 'app_id' })
  app: App;

  @OneToMany(() => AiConversationMessage, (aiConversationMessage) => aiConversationMessage.aiConversation, {
    onDelete: 'CASCADE',
  })
  aiConversationMessages: AiConversationMessage[];
}
