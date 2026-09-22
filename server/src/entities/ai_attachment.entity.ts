import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ai_attachments')
export class AiAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  type: string;

  @Column({ type: 'integer' })
  size: number;

  @Column({ name: 's3_bucket', type: 'text' })
  s3Bucket: string;

  @Column({ name: 's3_key', type: 'text' })
  s3Key: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: 'pending' | 'ready' | 'failed';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
