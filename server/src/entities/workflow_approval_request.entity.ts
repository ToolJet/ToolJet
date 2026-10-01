import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkflowExecution } from './workflow_execution.entity';
import { WorkflowExecutionNode } from './workflow_execution_node.entity';
import { User } from './user.entity';

export type ApprovalRequestStatus = 'pending' | 'resolved' | 'expired' | 'cancelled';

@Entity({ name: 'workflow_approval_requests' })
export class WorkflowApprovalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_execution_id' })
  workflowExecutionId: string;

  @Column({ name: 'execution_node_id' })
  executionNodeId: string;

  @Column({ name: 'token' })
  token: string;

  @Column({ name: 'status', default: 'pending' })
  status: ApprovalRequestStatus;

  @Column({ name: 'resolved_outcome', nullable: true })
  resolvedOutcome: string | null;

  @Column('jsonb', { name: 'input', nullable: true })
  input: Record<string, unknown> | null;

  @Column({ name: 'resolved_by_user_id', type: 'uuid', nullable: true })
  resolvedByUserId: string | null;

  @Column('jsonb', { name: 'approvers_snapshot' })
  approversSnapshot: Record<string, unknown>;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ name: 'app_id', type: 'uuid', nullable: true })
  appId: string | null;

  @Column({ name: 'environment_id', type: 'uuid', nullable: true })
  environmentId: string | null;

  @ManyToOne(() => WorkflowExecution)
  @JoinColumn({ name: 'workflow_execution_id' })
  workflowExecution: WorkflowExecution;

  @ManyToOne(() => WorkflowExecutionNode)
  @JoinColumn({ name: 'execution_node_id' })
  executionNode: WorkflowExecutionNode;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'resolved_by_user_id' })
  resolvedByUser: User | null;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
}
