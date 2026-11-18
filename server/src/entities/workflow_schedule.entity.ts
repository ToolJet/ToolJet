import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AppVersion } from './app_version.entity';

@Entity({ name: 'workflow_schedules' })
export class WorkflowSchedule {
  @PrimaryGeneratedColumn()
  public id: string;

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: AppVersion;

  @Column({ name: 'active' })
  active: boolean;

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @Column({ name: 'app_id', type: 'uuid' })
  appId: string;

  @Column({ name: 'environment_id' })
  environmentId: string;

  @Column({ name: 'type' })
  type: string;

  @Column({ name: 'timezone' })
  timezone: string;

  @Column('simple-json', { name: 'details', nullable: false })
  details: any;

  @Column('jsonb', { name: 'params', nullable: true })
  params: Record<string, unknown> | null;

  @Column({ name: 'workflow_id' })
  workflowId: string;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
}
