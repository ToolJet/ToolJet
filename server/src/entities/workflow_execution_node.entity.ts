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

  @Column({ name: 'executed' })
  executed: boolean;

  @Column({ name: 'id_on_workflow_definition' })
  idOnWorkflowDefinition: string;

  @Column({ name: 'workflow_execution_id' })
  workflowExecutionId: string;

  @Column('json', { name: 'definition' })
  definition;

  @ManyToOne(() => WorkflowExecution, (workflowExecution) => workflowExecution.id)
  @JoinColumn({ name: 'workflow_execution_id' })
  workflowExecution: WorkflowExecution;

  @OneToMany(
    () => WorkflowExecutionEdge,
    (workflowExecutionEdge) => workflowExecutionEdge.sourceWorkflowExecutionNode,
    {
      cascade: true,
    }
  )
  forwardEdges: WorkflowExecutionEdge[];

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;
}
