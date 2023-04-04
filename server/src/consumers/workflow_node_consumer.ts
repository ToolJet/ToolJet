import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { AppVersion } from 'src/entities/app_version.entity';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
import { WorkflowExecutionEdge } from 'src/entities/workflow_execution_edge.entity';
import { WorkflowExecutionNode } from 'src/entities/workflow_execution_node.entity';
import { Repository } from 'typeorm';
import { find } from 'lodash';
import { DataQueriesService } from '@services/data_queries.service';
import { User } from 'src/entities/user.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { WorkflowExecutionsService } from '@services/workflow_executions.service';
import { getQueryVariables } from '../../lib/utils';

@Injectable()
@Processor('workflows')
export class WorkflowNodeConsumer {
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

    @InjectRepository(DataQuery)
    private dataQueriesRepository: Repository<DataQuery>,

    private dataQueriesService: DataQueriesService,

    private workflowExecutionService: WorkflowExecutionsService
  ) {}

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

  @Process('execute')
  async execute(job: Job<any>) {
    const { nodeId, userId } = job.data;
    const workflowExecutionNode = await this.workflowExecutionNodeRepository.findOne(nodeId);
    const workflowExecution = await this.workflowExecutionRepository.findOne(workflowExecutionNode.workflowExecutionId);
    const appVersion = await this.appVersionsRepository.findOne(workflowExecution.appVersionId);

    const { state, previousNodesExecutionCompletionStatus } =
      await this.getStateAndPreviousNodesExecutionCompletionStatus(workflowExecutionNode);

    if (!previousNodesExecutionCompletionStatus) {
      void this.workflowExecutionService.enqueueNode(workflowExecutionNode, userId);
    } else {
      switch (workflowExecutionNode.type) {
        case 'input': {
          void this.workflowExecutionService.completeNodeExecution(workflowExecutionNode, '', {});
          void this.workflowExecutionService.enqueueForwardNodes(workflowExecutionNode, {}, userId);
          break;
        }

        case 'query': {
          const queryId = find(appVersion.definition.queries, {
            idOnDefinition: workflowExecutionNode.definition.idOnDefinition,
          }).id;

          const query = await this.dataQueriesService.findOne(queryId);
          const user = await this.userRepository.findOne(userId, { relations: ['organization'] });
          user.organizationId = user.organization.id;
          try {
            void getQueryVariables(query.options, state);
          } catch (e) {
            console.log({ e });
          }

          const options = getQueryVariables(query.options, state);
          try {
            const result = await this.dataQueriesService.runQuery(user, query, options);

            const newState = {
              ...state,
              [query.name]: result,
            };

            void this.workflowExecutionService.completeNodeExecution(
              workflowExecutionNode,
              JSON.stringify(result),
              newState
            );
            void this.workflowExecutionService.enqueueForwardNodes(workflowExecutionNode, newState, userId);
          } catch (exception) {
            const result = { status: 'failed' };

            const newState = {
              ...state,
              [query.name]: result,
            };

            void this.workflowExecutionService.completeNodeExecution(
              workflowExecutionNode,
              JSON.stringify(result),
              newState
            );
            void this.workflowExecutionService.enqueueForwardNodes(workflowExecutionNode, newState, userId);
            console.log({ exception });
          }

          break;
        }
      }
    }

    return {};
  }
}
