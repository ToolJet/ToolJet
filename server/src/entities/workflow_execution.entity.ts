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

  @Column({ name: 'executing_user_id' })
  executingUserId: string;

  @Column('json', { name: 'logs' })
  logs: string[];

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
