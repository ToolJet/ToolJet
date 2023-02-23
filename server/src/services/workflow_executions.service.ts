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
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class WorkflowExecutionsService {
  constructor(
    @InjectRepository(AppVersion)
    private appVersionsRepository: Repository<AppVersion>,

    @InjectRepository(WorkflowExecutionEdge)
    private workflowExecutionEdgeRepository: Repository<WorkflowExecutionEdge>,

    @InjectQueue('workflows')
    private workflowsQueue: Queue
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
            sourceWorkflowExecutionNodeId: find(nodes, (node) => node.idOnWorkflowDefinition === edgeData.source).id,
            targetWorkflowExecutionNodeId: find(nodes, (node) => node.idOnWorkflowDefinition === edgeData.target).id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
      }

      await this.enqueueForwardNodes(nodes[0], {});

      return workflowExecution;
    });

    return workflowExecution;
  }

  async enqueueForwardNodes(startNode: WorkflowExecutionNode, state: object = {}): Promise<WorkflowExecutionNode[]> {
    const forwardEdges = await startNode.forwardEdges;
    const edges = await this.workflowExecutionEdgeRepository.find();
    console.log({ forwardEdges, edges, startNode });
    // const forwardNodes = forwardEdges.map((edge) => edge.targetWorkflowExecutionNode);
    // for (const node of forwardNodes) {
    //   const job = await this.workflowsQueue.add('execute', {
    //     id: node.id,
    //     definition: node.definition,
    //     state,
    //   });

    //   console.log({ job });
    // }
    return [];
  }
}
