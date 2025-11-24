import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AiConversation } from './ai_conversation.entity';
import { AiConversationMessage } from './ai_conversation_message.entity';

@Entity('artifacts')
export class Artifact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'conversation_id',
    type: 'uuid',
    nullable: false,
  })
  conversationId: string;

  @Column({
    name: 'message_id',
    type: 'uuid',
    nullable: false,
  })
  messageId: string;

  @Column({ type: 'jsonb', nullable: false })
  content: any;

  @Column({ type: 'varchar', nullable: false })
  identifier: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AiConversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: AiConversation;

  @ManyToOne(() => AiConversationMessage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: AiConversationMessage;
}
