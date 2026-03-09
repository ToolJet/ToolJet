import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { App } from './app.entity';
import { WorkspaceBranch } from './workspace_branch.entity';

@Entity({ name: 'app_branch_state' })
@Unique('uq_app_branch_state_org_branch_corel', ['organizationId', 'branchId', 'coRelationId'])
export class AppBranchState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'app_id', nullable: true })
  appId: string;

  @Column({ name: 'co_relation_id' })
  coRelationId: string;

  @Column({ name: 'app_name' })
  appName: string;

  @Column({ name: 'meta_timestamp', type: 'numeric', precision: 15, nullable: true, default: null })
  metaTimestamp: number;

  @Column({ name: 'pulled_at', type: 'timestamp', nullable: true, default: null })
  pulledAt: Date;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => App, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'app_id' })
  app: App;

  @ManyToOne(() => WorkspaceBranch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: WorkspaceBranch;
}
