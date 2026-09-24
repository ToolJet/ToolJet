import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AppVersion } from './app_version.entity';
import { User } from './user.entity';
import { WorkflowExecutionNode } from './workflow_execution_node.entity';
import { WorkflowExecutionEdge } from './workflow_execution_edge.entity';

@Entity({ name: 'workflow_executions' })
export class WorkflowExecution {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column({ name: 'app_version_id' })
  appVersionId: string;

  @Column({ name: 'start_node_id' })
  startNodeId: string;

  @Column({ name: 'executed' })
  executed: boolean;

  @Column({ name: 'status' })
  status: string;

  @Column({ name: 'executing_user_id' })
  executingUserId: string;

  @Column('json', { name: 'logs' })
  logs: string[];

  @Column({ name: 'parent_execution_id', type: 'uuid', nullable: true })
  parentExecutionId: string | null;

  @Column({ name: 'parent_node_id', type: 'uuid', nullable: true })
  parentNodeId: string | null;

  @Column({ name: 'schedule_id', type: 'uuid', nullable: true })
  scheduleId: string | null;

  @Column({ name: 'environment_id', type: 'uuid', nullable: true })
  environmentId: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string;

  @Column({ name: 'app_id', type: 'uuid', nullable: true })
  appId: string;

  @Column({ name: 'trigger_type', type: 'varchar', nullable: true })
  triggerType: string;

  // Wall-clock bounds of the run. Deliberately separate from created_at/updated_at: updated_at is
  // an @UpdateDateColumn that bumps on any write, so a human-in-the-loop run resumed two days
  // later would otherwise report a two-day duration.
  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @OneToOne(() => User)
  @JoinColumn({ name: 'executing_user_id' })
  user: User;

  @OneToOne(() => WorkflowExecutionNode)
  @JoinColumn({ name: 'start_node_id' })
  startNode: WorkflowExecutionNode;

  @OneToMany(() => WorkflowExecutionNode, (node) => node.workflowExecution)
  nodes: WorkflowExecutionNode[];

  @OneToMany(() => WorkflowExecutionEdge, (edge) => edge.workflowExecution)
  edges: WorkflowExecutionEdge[];

  @ManyToOne(() => AppVersion, (appVersion) => appVersion.id)
  @JoinColumn({ name: 'app_version_id' })
  appVersion: AppVersion;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
}
