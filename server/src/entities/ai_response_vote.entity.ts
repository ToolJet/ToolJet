import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { AiConversationMessage } from './ai_conversation_message.entity';
import { User } from './user.entity';

@Entity('ai_response_votes')
export class AiResponseVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'ai_conversation_message_id',
    type: 'uuid',
    nullable: false,
  })
  aiConversationMessageId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({
    type: 'enum',
    enum: ['up', 'down'],
    nullable: false,
    name: 'vote_type',
  })
  voteType: 'up' | 'down';

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.aiResponseVotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => AiConversationMessage, (aiConversationMessage) => aiConversationMessage.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ai_conversation_message_id' })
  aiConversationMessage: AiConversationMessage;
}
