import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppVersion } from 'src/entities/app_version.entity';
import { App } from 'src/entities/app.entity';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
import { WorkflowExecutionNode } from 'src/entities/workflow_execution_node.entity';
import { WorkflowExecutionEdge } from 'src/entities/workflow_execution_edge.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager, Repository } from 'typeorm';
import { find } from 'lodash';
import { DataQueriesService } from './data_queries.service';
import { User } from 'src/entities/user.entity';
import { getQueryVariables, resolveCode } from '../../lib/utils';
import { Graph, alg } from '@dagrejs/graphlib';
import * as moment from 'moment';

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

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private dataQueriesService: DataQueriesService
  ) {}

  async create(createWorkflowExecutionDto: CreateWorkflowExecutionDto): Promise<WorkflowExecution> {
    const workflowExecution = await dbTransactionWrap(async (manager: EntityManager) => {
      const appVersionId =
        createWorkflowExecutionDto?.appVersionId ??
        (await manager.findOne(App, createWorkflowExecutionDto.appId)).editingVersion.id;

      const workflowExecution = await manager.save(
        WorkflowExecution,
        manager.create(WorkflowExecution, {
          appVersionId: appVersionId,
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
            type: nodeData.type,
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

      const edges = [];
      for (const edgeData of definition.edges) {
        // const sourceNode = find(nodes, (node) => node.idOnWorkflowDefinition === edgeData.source);
        // const targetNode = find(nodes, (node) => node.idOnWorkflowDefinition === edgeData.target);

        const edge = await manager.save(
          WorkflowExecutionEdge,
          manager.create(WorkflowExecutionEdge, {
            workflowExecutionId: workflowExecution.id,
            idOnWorkflowDefinition: edgeData.id,
            sourceWorkflowExecutionNodeId: find(nodes, (node) => node.idOnWorkflowDefinition === edgeData.source).id,
            targetWorkflowExecutionNodeId: find(nodes, (node) => node.idOnWorkflowDefinition === edgeData.target).id,
            sourceHandle: edgeData.sourceHandle,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );

        edges.push(edge);
      }

      return workflowExecution;
    });

    return workflowExecution;
  }

  async getStatus(workflowExecutionId: string) {
    const workflowExecution = await this.workflowExecutionRepository.findOne(workflowExecutionId);
    const workflowExecutionNodes = await this.workflowExecutionNodeRepository.find({
      where: {
        workflowExecutionId: workflowExecution.id,
      },
    });

    const nodes = workflowExecutionNodes.map((node) => ({
      id: node.id,
      idOnDefinition: node.idOnWorkflowDefinition,
      executed: node.executed,
      result: node.result,
    }));

    return {
      logs: workflowExecution.logs,
      status: workflowExecution.executed,
      nodes,
    };
  }

  async getWorkflowExecution(workflowExecutionId: string) {
    const workflowExecution = await this.workflowExecutionRepository.findOne(workflowExecutionId);

    return workflowExecution;
  }

  async listWorkflowExecutions(appVersionId: string) {
    const workflowExecutions = await this.workflowExecutionRepository.find({
      where: {
        appVersionId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 10,
    });

    return workflowExecutions;
  }

  async execute(workflowExecution: WorkflowExecution, params: object = {}): Promise<object> {
    const appVersion = await this.appVersionsRepository.findOne(workflowExecution.appVersionId, {
      relations: ['app'],
    });

    workflowExecution = await this.workflowExecutionRepository.findOne({
      where: {
        id: workflowExecution.id,
      },
      relations: ['startNode', 'user', 'nodes', 'edges'],
    });

    let finalResult = {};
    const logs = [];
    const queue = [];
    const addLog = (log: string) => logs.push(`[${moment().utc().format('YYYY-MM-DD HH:mm:ss.SSS')} UTC] ${log}`);
    if (appVersion.app.isMaintenanceOn) {
      queue.push(
        ...this.computeNodesToBeExecuted(workflowExecution.startNode, workflowExecution.nodes, workflowExecution.edges)
      );
    } else {
      addLog('Workflow is disabled.');
    }

    while (queue.length !== 0) {
      const currentTime = moment();
      const timeTaken = currentTime.diff(moment(workflowExecution.createdAt));
      if (timeTaken / 1000 > 30) {
        addLog('Execution stopped due to timeout');
        break;
      }
      const nodeToBeExecuted = queue.shift();

      const currentNode = await this.workflowExecutionNodeRepository.findOne({ where: { id: nodeToBeExecuted.id } });

      const { state } = await this.getStateAndPreviousNodesExecutionCompletionStatus(currentNode);

      // eslint-disable-next-line no-empty
      if (currentNode.executed) {
      } else {
        switch (currentNode.type) {
          case 'input': {
            await this.processStartNode(currentNode, params);
            break;
          }

          case 'query': {
            await this.processQueryNode(currentNode, workflowExecution, appVersion, state, addLog);
            break;
          }

          case 'if-condition': {
            const code = currentNode.definition?.code ?? '';

            const result = resolveCode({ code, state, isIfCondition: true, addLog });
            addLog('If condition evaluated to ' + result);
            const sourceHandleToBeSkipped = result ? 'false' : 'true';

            await this.completeNodeExecution(currentNode, JSON.stringify(result), {});

            const edgeToBeSkipped = workflowExecution.edges.filter(
              (edge) =>
                edge.sourceWorkflowExecutionNodeId === currentNode.id && edge.sourceHandle === sourceHandleToBeSkipped
            )[0];

            edgeToBeSkipped.skipped = true;

            queue.length = 0;
            queue.push(
              ...this.computeNodesToBeExecuted(
                workflowExecution.startNode,
                workflowExecution.nodes,
                workflowExecution.edges
              )
            );

            break;
          }

          case 'output': {
            const resultReceivedNodes = await this.incomingNodes(currentNode);
            // console.log('resultReceivedNodes', resultReceivedNodes);

            const result = Object.fromEntries(
              await Promise.all(
                resultReceivedNodes
                  .filter((node) => node.type === 'query')
                  .map(async (node) => {
                    const queryId = find(appVersion.definition.queries, {
                      idOnDefinition: node.definition.idOnDefinition,
                    }).id;

                    const query = await this.dataQueriesService.findOne(queryId);
                    return [query.name, JSON.parse(node.result)];
                  })
              )
            );

            finalResult = {
              ...state,
              result,
            };
            break;
          }
        }
      }
    }

    await this.markWorkflowAsExecuted(workflowExecution);
    await this.saveWorkflowLogs(workflowExecution, logs);

    return finalResult;
  }

  async processStartNode(node: WorkflowExecutionNode, params: object) {
    await this.completeNodeExecution(node, '', { startTrigger: { params } });
  }

  async processQueryNode(
    node: WorkflowExecutionNode,
    execution: WorkflowExecution,
    appVersion: AppVersion,
    state: object,
    addLog: any
  ) {
    const queryId = find(appVersion.definition.queries, {
      idOnDefinition: node.definition.idOnDefinition,
    }).id;

    const query = await this.dataQueriesService.findOne(queryId);
    //* beta: workflow execution's environment is "development" by default
    const currentEnvironmentId = appVersion.currentEnvironmentId;

    const user = await this.userRepository.findOne(execution.executingUserId, {
      relations: ['organization'],
    });
    user.organizationId = user.organization.id;
    try {
      void getQueryVariables(query.options, state);
    } catch (e) {
      console.log({ e });
    }

    const options = getQueryVariables(query.options, state);
    try {
      addLog(`${query.name}: Started execution`);
      const result =
        query.kind === 'runjs'
          ? resolveCode({ code: query.options?.code, state, addLog })
          : await this.dataQueriesService.runQuery(user, query, options, currentEnvironmentId);

      const newState = {
        ...state,
        [query.name]: result,
      };

      addLog(`${query.name}: Execution succeeded`);
      await this.completeNodeExecution(node, JSON.stringify(result), newState);
    } catch (exception) {
      addLog(`${query.name}: Execution failed`);
      const result = { status: 'failed', exception };

      const newState = {
        ...state,
        [query.name]: result,
      };

      await this.completeNodeExecution(node, JSON.stringify(result), newState);
      console.log({ exception });
    }
  }

  computeNodesToBeExecuted(
    currentNode: WorkflowExecutionNode,
    nodes: WorkflowExecutionNode[],
    edges: WorkflowExecutionEdge[]
  ) {
    const nodeIds = nodes.map((node) => node.id);
    const dag = new Graph({ directed: true });

    nodeIds.forEach((nodeId) => dag.setNode(nodeId));

    edges.forEach((edge) => {
      if (!edge.skipped) {
        dag.setEdge(edge.sourceWorkflowExecutionNodeId, edge.targetWorkflowExecutionNodeId);
      }
    });

    const sortedNodeIds = alg.topsort(dag);
    const traversedNodeIds = alg.postorder(dag, [currentNode.id]);

    const orderedNodes = sortedNodeIds
      .filter((nodeId) => traversedNodeIds.includes(nodeId))
      .map((id) => {
        return find(nodes, { id });
      });
    return orderedNodes;
  }

  async completeNodeExecution(node: WorkflowExecutionNode, result: any, state: object) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(WorkflowExecutionNode, node.id, { executed: true, result, state });
    });
  }

  async markWorkflowAsExecuted(workflow: WorkflowExecution) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(WorkflowExecution, workflow.id, { executed: true });
    });
  }

  async saveWorkflowLogs(workflow: WorkflowExecution, logs: string[]) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(WorkflowExecution, workflow.id, { logs });
    });
  }

  async getStateAndPreviousNodesExecutionCompletionStatus(node: WorkflowExecutionNode) {
    const incomingEdges = await this.workflowExecutionEdgeRepository.find({
      where: {
        targetWorkflowExecutionNodeId: node.id,
      },
      relations: ['sourceWorkflowExecutionNode'],
    });

    const incomingNodes = await Promise.all(incomingEdges.map((edge) => edge.sourceWorkflowExecutionNode));

    const previousNodesExecutionCompletionStatus = !incomingNodes.map((node) => node.executed).includes(false);

    const state = incomingNodes.reduce((existingState, node) => {
      const nodeState = node.state ?? {};
      return { ...existingState, ...nodeState };
    }, {});

    return { state, previousNodesExecutionCompletionStatus };
  }

  async forwardNodes(
    startNode: WorkflowExecutionNode,
    sourceHandle: string = undefined
  ): Promise<WorkflowExecutionNode[]> {
    const forwardEdges = await this.workflowExecutionEdgeRepository.find({
      where: {
        sourceWorkflowExecutionNode: startNode,
        ...(sourceHandle ? { sourceHandle } : {}),
      },
    });

    const forwardNodeIds = forwardEdges.map((edge) => edge.targetWorkflowExecutionNodeId);

    const forwardNodes = Promise.all(
      forwardNodeIds.map((id) =>
        this.workflowExecutionNodeRepository.findOne({
          where: {
            id,
          },
        })
      )
    );

    return forwardNodes;
  }

  async incomingNodes(startNode: WorkflowExecutionNode): Promise<WorkflowExecutionNode[]> {
    const incomingEdges = await this.workflowExecutionEdgeRepository.find({
      where: {
        targetWorkflowExecutionNode: startNode,
      },
    });

    const incomingNodeIds = incomingEdges.map((edge) => edge.sourceWorkflowExecutionNodeId);

    const receivedNodes = Promise.all(
      incomingNodeIds.map((id) =>
        this.workflowExecutionNodeRepository.findOne({
          where: {
            id,
          },
        })
      )
    );

    return receivedNodes;
  }
}
