import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { AiConversation } from '@entities/ai_conversation.entity';
import { AiResponseVote } from '@entities/ai_response_vote.entity';

@Entity('ai_conversation_messages')
export class AiConversationMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'ai_conversation_id',
    type: 'uuid',
    nullable: false,
  })
  aiConversationId: string;

  @Column({
    type: 'enum',
    enum: ['ai', 'user'],
    nullable: false,
    name: 'message_type',
  })
  messageType: 'ai' | 'user';

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'jsonb', nullable: true })
  references: any | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any | null;

  @Column({ type: 'boolean', default: false })
  deleted: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_latest' })
  isLatest: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'prompt_id' })
  promptId: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'parent_id' })
  parentId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AiConversation, (aiConversation) => aiConversation.aiConversationMessages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ai_conversation_id' })
  aiConversation: AiConversation;

  @OneToOne(() => AiResponseVote, (aiResponseVote) => aiResponseVote.aiConversationMessage)
  aiResponseVote: AiResponseVote;
}
