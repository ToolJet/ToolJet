import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AppVersion } from './app_version.entity';

@Entity({ name: 'workflow_bundles' })
export class WorkflowBundle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_version_id' })
  appVersionId: string;

  @Column('jsonb', { name: 'dependencies' })
  dependencies: Record<string, string>;

  @Column('text', { name: 'bundle_content', nullable: true })
  bundleContent: string;

  @Column({ name: 'bundle_size', nullable: true })
  bundleSize: number;

  @Column({ name: 'bundle_sha', length: 64, nullable: true })
  bundleSha: string;

  @Column({ name: 'generation_time_ms', nullable: true })
  generationTimeMs: number;

  @Column('text', { name: 'error', nullable: true })
  error: string;

  @Column({ name: 'status', default: 'none' })
  status: 'none' | 'building' | 'ready' | 'failed';

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.id)
  @JoinColumn({ name: 'app_version_id' })
  appVersion: AppVersion;
}
