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

@Entity({ name: 'workflow_execution_nodes' })
export class WorkflowExecutionNode {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column({ name: 'executed' })
  executed: boolean;

  @Column({ name: 'workflow_execution_id' })
  workflowExecutionId: string;

  @ManyToOne(() => WorkflowExecution, (workflowExecution) => workflowExecution.id)
  @JoinColumn({ name: 'workflow_execution_id' })
  workflowExecution: WorkflowExecution;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
}
