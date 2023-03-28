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

    @InjectRepository(WorkflowExecution)
    private workflowExecutionRepository: Repository<WorkflowExecution>,

    @InjectRepository(WorkflowExecutionEdge)
    private workflowExecutionEdgeRepository: Repository<WorkflowExecutionEdge>,

    @InjectRepository(WorkflowExecutionNode)
    private workflowExecutionNodeRepository: Repository<WorkflowExecutionNode>,

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

      const startNode = find(nodes, (node) => node.definition.nodeType === 'start');
      workflowExecution.startNodeId = startNode.id;

      await manager.update(WorkflowExecution, workflowExecution.id, { startNode });

      for (const edgeData of definition.edges) {
        // const sourceNode = find(nodes, (node) => node.idOnWorkflowDefinition === edgeData.source);
        // const targetNode = find(nodes, (node) => node.idOnWorkflowDefinition === edgeData.target);

        console.log({ nodes, edges: definition.edges });
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

      return workflowExecution;
    });

    const startNode = await this.workflowExecutionNodeRepository.findOne(workflowExecution.startNodeId);

    await this.enqueueForwardNodes(startNode, {}, createWorkflowExecutionDto.userId);

    return workflowExecution;
  }

  async enqueueForwardNodes(
    startNode: WorkflowExecutionNode,
    state: object = {},
    userId: string
  ): Promise<WorkflowExecutionNode[]> {
    const forwardEdges = await this.workflowExecutionEdgeRepository.find({
      where: {
        sourceWorkflowExecutionNode: startNode,
      },
    });

    const forwardNodeIds = forwardEdges.map((edge) => edge.targetWorkflowExecutionNodeId);

    for (const nodeId of forwardNodeIds) {
      await this.workflowsQueue.add('execute', {
        userId,
        nodeId,
        state,
      });
    }

    return [];
  }

  async completeNodeExecution(node: WorkflowExecutionNode, result: any) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(WorkflowExecutionNode, node.id, { executed: true, result });
    });
  }

  async getStatus(workflowExecutionId: string) {
    const workflowExecution = await this.workflowExecutionRepository.findOne(workflowExecutionId);
    const workflowExecutionNodes = await this.workflowExecutionNodeRepository.find({
      where: {
        workflowExecutionId: workflowExecution.id,
      },
    });

    return workflowExecutionNodes.map((node) => ({
      id: node.id,
      executed: node.executed,
      result: node.result,
    }));
  }
}
