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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'app_id' })
  appId: string;

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
