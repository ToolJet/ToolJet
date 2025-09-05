import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { App } from './app.entity';
import { AppVersion } from './app_version.entity';
import { User } from './user.entity';

@Entity({ name: 'app_history' })
@Index('IDX_UNIQUE_SEQ_PER_APP_VERSION', ['appVersionId', 'sequenceNumber'], { unique: true })
@Check(
  'check_history_payload_type',
  `
  (history_type = 'snapshot' AND jsonb_typeof(change_payload) = 'object') OR
  (history_type = 'delta' AND jsonb_typeof(change_payload) = 'array')
`
)
export class AppHistory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_id', type: 'uuid' })
  appId: string;

  @Column({ name: 'app_version_id', type: 'uuid' })
  appVersionId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'sequence_number', type: 'bigint' })
  sequenceNumber: number;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({
    name: 'history_type',
    type: 'enum',
    enum: ['snapshot', 'delta'],
  })
  historyType: 'snapshot' | 'delta';

  @Column({ name: 'action_type', type: 'varchar' })
  actionType: string;

  @Column({ name: 'operation_scope', type: 'jsonb', nullable: true })
  operationScope: Record<string, any>;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'change_payload', type: 'jsonb' })
  changePayload: Record<string, any> | any[];

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => App, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_id' })
  app: App;

  @ManyToOne(() => AppVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_version_id' })
  appVersion: AppVersion;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => AppHistory, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: AppHistory;
}
