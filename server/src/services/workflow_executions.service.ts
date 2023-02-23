import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppVersion } from 'src/entities/app_version.entity';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
import { WorkflowExecutionNode } from 'src/entities/workflow_execution_node.entity';
import { WorkflowExecutionEdge } from 'src/entities/workflow_execution_edge.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager, Repository } from 'typeorm';
import { find } from 'lodash';

@Injectable()
export class WorkflowExecutionsService {
  constructor(
    @InjectRepository(AppVersion)
    private appVersionsRepository: Repository<AppVersion>
  ) {}

  async create(createWorkflowExecutionDto: CreateWorkflowExecutionDto): Promise<WorkflowExecution> {
    const workflowExecution = await dbTransactionWrap(async (manager: EntityManager) => {
      const workflowExecution = await manager.save(
        WorkflowExecution,
        manager.create(WorkflowExecution, {
          appVersionId: createWorkflowExecutionDto.appVersionId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      const appVersion = await this.appVersionsRepository.findOne({ where: { id: workflowExecution.appVersionId } });
      const definition = appVersion.definition;

      const nodes = [];
      for (const nodeData of definition.nodes) {
        const node = await manager.save(
          WorkflowExecutionNode,
          manager.create(WorkflowExecutionNode, {
            workflowExecutionId: workflowExecution.id,
            idOnWorkflowDefinition: nodeData.id,
            definition: nodeData.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );

        nodes.push(node);
      }

      for (const edgeData of definition.edges) {
        await manager.save(
          WorkflowExecutionEdge,
          manager.create(WorkflowExecutionEdge, {
            workflowExecutionId: workflowExecution.id,
            idOnWorkflowDefinition: edgeData.id,
            sourceWorkflowExecutionNodeId: find(nodes, (node) => node.definition.id === edgeData.source).id,
            targetWorkflowExecutionNodeId: find(nodes, (node) => node.definition.id === edgeData.target).id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
      }

      return workflowExecution;
    });

    return workflowExecution;
  }
}
