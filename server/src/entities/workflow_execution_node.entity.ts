import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkflowExecution } from './workflow_execution.entity';
import { WorkflowExecutionEdge } from './workflow_execution_edge.entity';

@Entity({ name: 'workflow_execution_nodes' })
export class WorkflowExecutionNode {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column({ name: 'type' })
  type: string;

  @Column({ name: 'executed' })
  executed: boolean;

  @Column({ name: 'result' })
  result: string;

  @Column('simple-json', { name: 'state' })
  state;

  @Column({ name: 'id_on_workflow_definition' })
  idOnWorkflowDefinition: string;

  @Column({ name: 'workflow_execution_id' })
  workflowExecutionId: string;

  @Column('simple-json', { name: 'definition' })
  definition;

  @ManyToOne(() => WorkflowExecution, (workflowExecution) => workflowExecution.id)
  @JoinColumn({ name: 'workflow_execution_id' })
  workflowExecution: WorkflowExecution;

  @OneToMany(() => WorkflowExecutionEdge, (workflowExecutionEdge) => workflowExecutionEdge.sourceWorkflowExecutionNode)
  forwardEdges: WorkflowExecutionEdge[];

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
}
