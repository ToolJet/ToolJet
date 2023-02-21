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

@Entity({ name: 'workflow_executions' })
export class WorkflowExecution {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column({ name: 'app_version_id' })
  appVersionId: string;

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.id)
  @JoinColumn({ name: 'app_version_id' })
  appVersion: AppVersion;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
}
