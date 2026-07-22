import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

/**
 * An in-flight AI operation, held for as long as one is running for a builder.
 *
 * Exists so the LLM provider switch can be refused server-side while a generation
 * is in progress. Frontend state cannot carry that guarantee — a second browser
 * tab can open Session Overview while the first tab is mid-task.
 *
 * Rows are deleted when the operation finishes. `heartbeatAt` is refreshed while
 * the operation runs so a row orphaned by a crashed process ages out instead of
 * locking the builder out permanently.
 */
@Entity('ai_active_runs')
@Index('ai_active_runs_user_id_heartbeat_at_idx', ['userId', 'heartbeatAt'])
export class AiActiveRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId: string | null;

  @CreateDateColumn({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'heartbeat_at', type: 'timestamp', default: () => 'now()' })
  heartbeatAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
