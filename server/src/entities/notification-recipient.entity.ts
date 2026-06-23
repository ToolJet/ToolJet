import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Notification } from './notification.entity';

@Entity({ name: 'notification_recipients' })
@Unique(['notificationId', 'userId'])
@Index(['userId', 'createdAt'])
export class NotificationRecipient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'notification_id', type: 'uuid' })
  notificationId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null; // null = unread

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Notification, (n) => n.recipients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;
}
