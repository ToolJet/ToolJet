import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkflowExecution } from './workflow_execution.entity';
import { WorkflowExecutionNode } from './workflow_execution_node.entity';

@Entity({ name: 'workflow_execution_edges' })
export class WorkflowExecutionEdge {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column({ name: 'id_on_workflow_definition' })
  idOnWorkflowDefinition: string;

  @Column({ name: 'workflow_execution_id' })
  workflowExecutionId: string;

  @Column({ name: 'source_workflow_execution_node_id' })
  sourceWorkflowExecutionNodeId: string;

  @Column({ name: 'target_workflow_execution_node_id' })
  targetWorkflowExecutionNodeId: string;

  @Column({ name: 'source_handle' })
  sourceHandle: string;

  @ManyToOne(() => WorkflowExecutionNode, (workflowExecutionNode) => workflowExecutionNode.forwardEdges)
  @JoinColumn({ name: 'source_workflow_execution_node_id' })
  sourceWorkflowExecutionNode: WorkflowExecutionNode;

  @OneToOne(() => WorkflowExecutionNode)
  @JoinColumn({ name: 'target_workflow_execution_node_id' })
  targetWorkflowExecutionNode: WorkflowExecutionNode;

  @ManyToOne(() => WorkflowExecution, (workflowExecution) => workflowExecution.id)
  @JoinColumn({ name: 'workflow_execution_id' })
  workflowExecution: WorkflowExecution;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  skipped: boolean;
}
