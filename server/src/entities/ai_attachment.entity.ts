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

  @Column({
    type: 'bytea',
    select: false,
    transformer: {
      // pg calls toPostgres only on the wire; ORM errors, query logs and traces see a redacted value.
      to: (data: Buffer) =>
        data == null
          ? data
          : {
              toPostgres: () => data,
              toJSON: () => '[attachment bytes]',
            },
      from: (data: Buffer) => data,
    },
  })
  data: Buffer;

  @Column({ name: 'attached_at', type: 'timestamptz', nullable: true })
  attachedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
