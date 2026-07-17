import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { NotificationRecipient } from './notification-recipient.entity';

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'type', type: 'enum', enum: ['info', 'success', 'warning', 'error'] })
  type: string;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'body', type: 'text', nullable: true })
  body: string | null;

  @Column({ name: 'link', nullable: true })
  link: string | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => NotificationRecipient, (r) => r.notification)
  recipients: NotificationRecipient[];
}
