import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('ai_attachments')
export class AiAttachment {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId: string;

  @Column({ name: 'storage_organization_id', type: 'uuid', nullable: true })
  storageOrganizationId: string;

  @Column({ name: 'storage_user_id', type: 'uuid', nullable: true })
  storageUserId: string;

  @Column({ name: 'next_cleanup_at', type: 'timestamptz' })
  nextCleanupAt: Date;

  @Column({ name: 'cleanup_attempts', type: 'integer', default: 0 })
  cleanupAttempts: number;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'mime_type', length: 255 })
  type: string;

  @Column({ type: 'integer' })
  size: number;

  @Column({ length: 64 })
  sha256: string;

  @Column({ length: 16, default: 'draft' })
  state: 'uploading' | 'draft' | 'attached' | 'deleting';

  @Column({ name: 'attached_at', type: 'timestamptz', nullable: true })
  attachedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
