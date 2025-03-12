// import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { AppVersion } from 'src/entities/app_version.entity';
// import { App } from 'src/entities/app.entity';
// import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
// import { WorkflowExecutionNode } from 'src/entities/workflow_execution_node.entity';
// import { WorkflowExecutionEdge } from 'src/entities/workflow_execution_edge.entity';
// import { dbTransactionWrap } from 'src/helpers/database.helper';
// import { EntityManager, Repository } from 'typeorm';
// import { find } from 'lodash';
// import { DataQueriesService } from '../modules/data-queries/service';
// import { User } from 'src/entities/user.entity';
// import { getQueryVariables, resolveCode } from '../../lib/utils';
// import { Graph, alg } from '@dagrejs/graphlib';
// import * as moment from 'moment';
// import { stringify } from 'flatted';
// import { OrganizationConstantsService } from '../modules/organization-constants/service';
// // import { Organization } from 'src/entities/organization.entity';
// import { Response } from 'express';
// import { cloneDeep } from 'lodash';

// const STATIC_NODE_TYPE_TO_HANDLE_MAPPING = {
//   input: 'startTrigger',
//   output: 'responseNode',
//   'if-condition': 'ifCondition',
// };
// import { OrganizationConstantType } from 'src/entities/organization_constants.entity';
// import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
// import { LICENSE_FIELD, LICENSE_LIMIT } from '@modules/licensing/constants';

// @Injectable()
// export class WorkflowExecutionsService {
//   constructor(
//     @InjectRepository(AppVersion)
//     private appVersionsRepository: Repository<AppVersion>,

//     @InjectRepository(WorkflowExecution)
//     private workflowExecutionRepository: Repository<WorkflowExecution>,

//     @InjectRepository(WorkflowExecutionEdge)
//     private workflowExecutionEdgeRepository: Repository<WorkflowExecutionEdge>,

//     @InjectRepository(WorkflowExecutionNode)
//     private workflowExecutionNodeRepository: Repository<WorkflowExecutionNode>,

//     @InjectRepository(User)
//     private userRepository: Repository<User>,

//     private dataQueriesService: DataQueriesService,
//     private licenseTermsService: LicenseTermsService,
//     private organizationConstantsService: OrganizationConstantsService
//   ) {}

//   workflowExecutionTimeout = parseInt(process.env.WORKFLOW_TIMEOUT_SECONDS);

//   async create(createWorkflowExecutionDto: CreateWorkflowExecutionDto): Promise<WorkflowExecution> {
//     const workflowExecution = await dbTransactionWrap(async (manager: EntityManager) => {
//       const appVersionId =
//         createWorkflowExecutionDto?.appVersionId ??
//         (
//           await manager.findOne(App, {
//             where: { id: createWorkflowExecutionDto.appId },
//           })
//         ).editingVersion.id;

//       const workflowExecution = await manager.save(
//         WorkflowExecution,
//         manager.create(WorkflowExecution, {
//           appVersionId: appVersionId,
//           createdAt: new Date(),
//           updatedAt: new Date(),
//         })
//       );

//       const appVersion = await this.appVersionsRepository.findOne({ where: { id: workflowExecution.appVersionId } });
//       const definition = appVersion.definition;

//       const queryIdsOnDefinitionToActualQueryIdMapping = Object.fromEntries(
//         definition.nodes
//           .filter((node) => node.type === 'query')
//           .map((node) => node.data.idOnDefinition)
//           .map((idOnDefinition) => [
//             idOnDefinition,
//             find(appVersion.definition.queries, {
//               idOnDefinition,
//             }).id,
//           ])
//       );

//       const queries = await this.dataQueriesService.findByIds(
//         Object.values(queryIdsOnDefinitionToActualQueryIdMapping)
//       );

//       const nodes = [];
//       for (const nodeData of definition.nodes) {
//         nodeData.data.handle = this.computeNodeHandle(nodeData, queries, queryIdsOnDefinitionToActualQueryIdMapping);

//         const node = await manager.save(
//           WorkflowExecutionNode,
//           manager.create(WorkflowExecutionNode, {
//             type: nodeData.type,
//             workflowExecutionId: workflowExecution.id,
//             idOnWorkflowDefinition: nodeData.id,
//             definition: nodeData.data,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           })
//         );

//         nodes.push(node);
//       }

//       const startNode = find(nodes, (node) => node.definition.nodeType === 'start');
//       workflowExecution.startNodeId = startNode.id;

//       await manager.update(WorkflowExecution, workflowExecution.id, { startNode });

//       const edges = [];
//       for (const edgeData of definition.edges) {
//         // const sourceNode = find(nodes, (node) => node.idOnWorkflowDefinition === edgeData.source);
//         // const targetNode = find(nodes, (node) => node.idOnWorkflowDefinition === edgeData.target);

//         const edge = await manager.save(
//           WorkflowExecutionEdge,
//           manager.create(WorkflowExecutionEdge, {
//             workflowExecutionId: workflowExecution.id,
//             idOnWorkflowDefinition: edgeData.id,
//             sourceWorkflowExecutionNodeId: find(nodes, (node) => node.idOnWorkflowDefinition === edgeData.source).id,
//             targetWorkflowExecutionNodeId: find(nodes, (node) => node.idOnWorkflowDefinition === edgeData.target).id,
//             sourceHandle: edgeData.sourceHandle,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           })
//         );

//         edges.push(edge);
//       }

//       return workflowExecution;
//     });

//     return workflowExecution;
//   }

//   async getStatus(workflowExecutionId: string) {
//     const workflowExecution = await this.workflowExecutionRepository.findOne({
//       where: { id: workflowExecutionId },
//     });
//     const workflowExecutionNodes = await this.workflowExecutionNodeRepository.find({
//       where: {
//         workflowExecutionId: workflowExecution.id,
//       },
//     });

//     const nodes = workflowExecutionNodes.map((node) => ({
//       id: node.id,
//       idOnDefinition: node.idOnWorkflowDefinition,
//       executed: node.executed,
//       result: node.result,
//     }));

//     return {
//       logs: workflowExecution.logs,
//       status: workflowExecution.executed,
//       nodes,
//     };
//   }

//   async getWorkflowExecution(workflowExecutionId: string) {
//     const workflowExecution = await this.workflowExecutionRepository.findOne({
//       where: { id: workflowExecutionId },
//     });
//     const nodes = await this.workflowExecutionNodeRepository.find({
//       where: { id: workflowExecutionId },
//     });
//     const appVersion = await this.appVersionsRepository.findOne({
//       where: { id: workflowExecution.appVersionId },
//     });
//     const queries = await this.dataQueriesService.all({ app_version_id: appVersion.id });

//     const nodesWithHandles = nodes.map((node) => {
//       const queryId = find(appVersion.definition.queries, {
//         idOnDefinition: node.definition.idOnDefinition,
//       })?.id;

//       const query = find(queries, { id: queryId });
//       if (query) {
//         node.definition.handle = query.name;
//       } else {
//         node.definition.handle = STATIC_NODE_TYPE_TO_HANDLE_MAPPING[node.type];
//       }

//       return node;
//     });

//     workflowExecution.nodes = nodesWithHandles;

//     return workflowExecution;
//   }

//   async listWorkflowExecutions(appVersionId: string) {
//     const workflowExecutions = await this.workflowExecutionRepository.find({
//       where: {
//         appVersionId,
//       },
//       order: {
//         createdAt: 'DESC',
//       },
//       relations: ['nodes'],
//       take: 10,
//     });

//     return workflowExecutions;
//   }

//   async execute(
//     workflowExecution: WorkflowExecution,
//     params: object = {},
//     envId = '',
//     response: Response
//   ): Promise<object> {
//     const organization: any = await dbTransactionWrap(async (manager: EntityManager) => {
//       return manager
//         .createQueryBuilder('organizations', 'organization')
//         .innerJoin('apps', 'app', 'app.organization_id = organization.id')
//         .innerJoin('app_versions', 'av', 'av.app_id = app.id')
//         .innerJoin('workflow_executions', 'we', 'we.app_version_id = av.id')
//         .where('we.id = :workflowExecutionId', { workflowExecutionId: workflowExecution.id })
//         .getOne();
//     });

//     const constants = await this.organizationConstantsService.getConstantsForEnvironment(
//       organization.id,
//       envId,
//       OrganizationConstantType.GLOBAL
//     );
//     const constantsObject = Object.fromEntries(constants.map((constant) => [constant.name, constant.value]));
//     const appVersion = await this.appVersionsRepository.findOne({
//       where: {
//         id: workflowExecution.appVersionId,
//       },
//       relations: ['app'],
//     });

//     this.workflowExecutionTimeout =
//       (await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.WORKFLOWS))?.execution_timeout ??
//       parseInt(process.env.WORKFLOW_TIMEOUT_SECONDS);

//     if (envId) appVersion.currentEnvironmentId = envId;

//     workflowExecution = await this.workflowExecutionRepository.findOne({
//       where: {
//         id: workflowExecution.id,
//       },
//       relations: ['startNode', 'user', 'nodes', 'edges'],
//     });

//     let finalResult = {};
//     const logs = [];
//     const queue = [];

//     const addLog = (message: string, status = 'normal') =>
//       logs.push({ createdAt: moment().utc().format('YYYY-MM-DD HH:mm:ss.SSS'), message, nodeId: undefined, status });

//     // FIXME: isMaintenanceOn - Column is used to check whether workflow is enabled or not.
//     if (appVersion.app.isMaintenanceOn) {
//       queue.push(
//         ...this.computeNodesToBeExecuted(workflowExecution.startNode, workflowExecution.nodes, workflowExecution.edges)
//       );
//     } else {
//       addLog('Workflow is disabled', 'failure');
//     }

//     let executionFailed = false;
//     while (queue.length != 0 && executionFailed === false) {
//       const nodeToBeExecuted = queue.shift();
//       const currentNode = await this.workflowExecutionNodeRepository.findOne({ where: { id: nodeToBeExecuted.id } });

//       const addLog = (message: string, queryName: string = undefined, status = 'normal') =>
//         logs.push({
//           createdAt: moment().utc().format('YYYY-MM-DD HH:mm:ss.SSS'),
//           message,
//           nodeId: currentNode.idOnWorkflowDefinition,
//           kind: currentNode?.definition?.kind ?? STATIC_NODE_TYPE_TO_HANDLE_MAPPING[currentNode.type],
//           handle: queryName ? queryName : STATIC_NODE_TYPE_TO_HANDLE_MAPPING[currentNode.type],
//           status,
//         });

//       const currentTime = moment();
//       const timeTaken = currentTime.diff(moment(workflowExecution.createdAt));
//       if (timeTaken / 1000 > this.workflowExecutionTimeout) {
//         addLog('Execution stopped due to timeout', undefined, 'failure');
//         break;
//       }

//       let { state } = await this.getStateAndPreviousNodesExecutionCompletionStatus(currentNode);

//       state = { constants: constantsObject, ...state };

//       // eslint-disable-next-line no-empty
//       if (currentNode.executed) {
//       } else {
//         switch (currentNode.type) {
//           case 'input': {
//             const { result } = await this.processStartNode(currentNode, params, addLog);

//             if (result?.status === 'failed') executionFailed = true;
//             break;
//           }

//           case 'query': {
//             const { result } = await this.processQueryNode(
//               currentNode,
//               workflowExecution,
//               appVersion,
//               state,
//               addLog,
//               response,
//               queue
//             );

//             if (result?.status === 'failed' && !currentNode.definition.errorHandler) executionFailed = true;
//             break;
//           }

//           case 'if-condition': {
//             const { result } = await this.processIfConditionNode(
//               currentNode,
//               workflowExecution,
//               appVersion,
//               state,
//               addLog,
//               response,
//               queue
//             );

//             if (result?.status === 'failed') executionFailed = true;
//             break;
//           }

//           case 'output': {
//             const { result } = await this.processResponseNode(
//               currentNode,
//               workflowExecution,
//               appVersion,
//               state,
//               addLog,
//               response,
//               queue
//             );

//             finalResult = result?.data ?? {};

//             if (result?.status === 'failed') executionFailed = true;
//             break;
//           }
//         }
//       }
//     }

//     await this.saveExecutionStatus({ workflowExecution, logs, executionFailed });
//     await this.markWorkflowAsExecuted(workflowExecution);
//     await this.saveWorkflowLogs(workflowExecution, logs);

//     return finalResult;
//   }

//   async processStartNode(node: WorkflowExecutionNode, params: object, addLog) {
//     addLog('Execution started', undefined, 'success');
//     await this.completeNodeExecution(node, '', { startTrigger: { params } });

//     const result: any = { status: 'ok' };

//     return { result };
//   }

//   async processQueryNode(
//     node: WorkflowExecutionNode,
//     execution: WorkflowExecution,
//     appVersion: AppVersion,
//     state: object,
//     basicAddLog: any,
//     response: Response,
//     queue: WorkflowExecutionNode[]
//   ) {
//     const queryId = find(appVersion.definition.queries, {
//       idOnDefinition: node.definition.idOnDefinition,
//     }).id;

//     const query = await this.dataQueriesService.findOne(queryId);

//     const addLog = (message, status = 'normal') => basicAddLog(message, query.name, status);

//     //* beta: workflow execution's environment is "development" by default
//     const currentEnvironmentId = appVersion.currentEnvironmentId;

//     const user = await this.userRepository.findOne({
//       where: {
//         id: execution.executingUserId,
//       },
//       relations: ['organization'],
//     });
//     user.organizationId = user.organization.id;

//     let result: any = {};
//     let handleToSkip = 'failure';

//     try {
//       addLog(`Started execution`);
//       if (node.definition.looped) {
//         const iterationValues = resolveCode({ code: node.definition?.iterationValuesCode, state, addLog });

//         if (!Array.isArray(iterationValues)) throw new Error('Loop array did not resolve into an array');

//         let index = 0;
//         result = [];
//         for (const value of iterationValues) {
//           const currentTime = moment();
//           const timeTaken = currentTime.diff(moment(execution.createdAt));
//           if (timeTaken / 1000 > this.workflowExecutionTimeout) {
//             throw new Error('Execution stopped due to timeout');
//           }
//           const modifiedState = { ...state, value, index };
//           const options = getQueryVariables(query.options, modifiedState, addLog);
//           result.push(
//             query.kind === 'runjs'
//               ? resolveCode({ code: query.options?.code, state: modifiedState, addLog })
//               : (
//                   await this.dataQueriesService.runQuery(
//                     user,
//                     cloneDeep(query),
//                     options,
//                     response,
//                     currentEnvironmentId
//                   )
//                 )['data']
//           );

//           index++;
//         }
//       } else {
//         const options = getQueryVariables(query.options, state, addLog);
//         result =
//           query.kind === 'runjs'
//             ? resolveCode({ code: query.options?.code, state, addLog })
//             : (await this.dataQueriesService.runQuery(user, query, options, response, currentEnvironmentId))['data'];
//       }

//       const decoratedResult = { status: 'ok', data: result };

//       const newState = {
//         ...state,
//         [query.name]: decoratedResult,
//       };

//       addLog(`Execution succeeded`, 'success');
//       await this.completeNodeExecution(node, stringify(decoratedResult), newState);
//     } catch (exception) {
//       // if (exception instanceof TypeError) throw exception;
//       addLog(`Execution failed: ${exception.message}`, 'failure');
//       result = { status: 'failed', exception };

//       const newState = {
//         ...state,
//         [query.name]: result,
//       };

//       handleToSkip = 'success';

//       await this.completeNodeExecution(node, stringify(result), newState);
//     }

//     execution.edges
//       .filter((edge) => edge.sourceWorkflowExecutionNodeId === node.id && edge.sourceHandle == handleToSkip)
//       .forEach((edge) => (edge.skipped = true));

//     queue.length = 0;
//     queue.push(...this.computeNodesToBeExecuted(execution.startNode, execution.nodes, execution.edges));

//     return { result };
//   }

//   async processIfConditionNode(
//     currentNode: WorkflowExecutionNode,
//     workflowExecution: WorkflowExecution,
//     appVersion: AppVersion,
//     state: object,
//     addLog: any,
//     response: Response,
//     queue: WorkflowExecutionNode[]
//   ) {
//     const code = currentNode.definition?.code ?? '';
//     let sourceHandleToBeSkipped = 'false';
//     let result: any = {};

//     try {
//       result = { status: 'ok', data: resolveCode({ code, state, isIfCondition: true, addLog }) };
//       addLog('If condition evaluated to ' + result);
//       sourceHandleToBeSkipped = result.data ? 'false' : 'true';

//       await this.completeNodeExecution(currentNode, stringify(result), { ...state });
//     } catch (exception) {
//       addLog(`Code within if condition failed: ${exception.message}`);
//       result = { status: 'failed' };
//       await this.completeNodeExecution(currentNode, stringify(result), { ...state });
//     }

//     workflowExecution.edges
//       .filter(
//         (edge) => edge.sourceWorkflowExecutionNodeId === currentNode.id && edge.sourceHandle === sourceHandleToBeSkipped
//       )
//       .forEach((edge) => (edge.skipped = true));

//     queue.length = 0;
//     queue.push(
//       ...this.computeNodesToBeExecuted(workflowExecution.startNode, workflowExecution.nodes, workflowExecution.edges)
//     );

//     return { result };
//   }

//   async processResponseNode(
//     currentNode: WorkflowExecutionNode,
//     workflowExecution: WorkflowExecution,
//     appVersion: AppVersion,
//     state: object,
//     addLog: any,
//     response: Response,
//     queue: WorkflowExecutionNode[]
//   ) {
//     const code = currentNode.definition?.code ?? '';
//     let result: any = {};

//     try {
//       result = {
//         data: resolveCode({
//           code,
//           state,
//           isIfCondition: false,
//           addLog,
//         }),
//         status: 'ok',
//       };
//       await this.completeNodeExecution(currentNode, stringify(result), state);
//     } catch (exception) {
//       result = { status: 'failed' };
//       await this.completeNodeExecution(currentNode, stringify(result), state);
//     }

//     return { result };
//   }

//   computeNodesToBeExecuted(
//     currentNode: WorkflowExecutionNode,
//     nodes: WorkflowExecutionNode[],
//     edges: WorkflowExecutionEdge[]
//   ) {
//     const nodeIds = nodes.map((node) => node.id);
//     const dag = new Graph({ directed: true });

//     nodeIds.forEach((nodeId) => dag.setNode(nodeId));

//     edges.forEach((edge) => {
//       if (!edge.skipped) {
//         dag.setEdge(edge.sourceWorkflowExecutionNodeId, edge.targetWorkflowExecutionNodeId);
//       }
//     });

//     const sortedNodeIds = alg.topsort(dag);
//     const traversedNodeIds = alg.postorder(dag, [currentNode.id]);

//     const orderedNodes = sortedNodeIds
//       .filter((nodeId) => traversedNodeIds.includes(nodeId))
//       .map((id) => {
//         return find(nodes, { id });
//       });
//     return orderedNodes;
//   }

//   async completeNodeExecution(node: WorkflowExecutionNode, result: any, state: object) {
//     await dbTransactionWrap(async (manager: EntityManager) => {
//       await manager.update(WorkflowExecutionNode, node.id, { executed: true, result, state });
//     });
//   }

//   async markWorkflowAsExecuted(workflow: WorkflowExecution) {
//     await dbTransactionWrap(async (manager: EntityManager) => {
//       await manager.update(WorkflowExecution, workflow.id, { executed: true });
//     });
//   }

//   async saveWorkflowLogs(workflow: WorkflowExecution, logs: any[]) {
//     await dbTransactionWrap(async (manager: EntityManager) => {
//       await manager.update(WorkflowExecution, workflow.id, { logs });
//     });
//   }

//   async saveExecutionStatus({ workflowExecution, logs, executionFailed }) {
//     await dbTransactionWrap(async (manager: EntityManager) => {
//       const status = executionFailed ? 'failure' : 'success';
//       await manager.update(WorkflowExecution, workflowExecution.id, { logs, status });
//     });
//   }

//   async getStateAndPreviousNodesExecutionCompletionStatus(node: WorkflowExecutionNode) {
//     const incomingEdges = await this.workflowExecutionEdgeRepository.find({
//       where: {
//         targetWorkflowExecutionNodeId: node.id,
//       },
//       relations: ['sourceWorkflowExecutionNode'],
//     });

//     const incomingNodes = await Promise.all(incomingEdges.map((edge) => edge.sourceWorkflowExecutionNode));

//     const previousNodesExecutionCompletionStatus = !incomingNodes.map((node) => node.executed).includes(false);

//     const state = incomingNodes.reduce((existingState, node) => {
//       const nodeState = node.state ?? {};
//       return { ...existingState, ...nodeState };
//     }, {});

//     return { state, previousNodesExecutionCompletionStatus };
//   }

//   async forwardNodes(
//     startNode: WorkflowExecutionNode,
//     sourceHandle: string = undefined
//   ): Promise<WorkflowExecutionNode[]> {
//     const forwardEdges = await this.workflowExecutionEdgeRepository.find({
//       where: {
//         sourceWorkflowExecutionNode: startNode,
//         ...(sourceHandle ? { sourceHandle } : {}),
//       },
//     });

//     const forwardNodeIds = forwardEdges.map((edge) => edge.targetWorkflowExecutionNodeId);

//     const forwardNodes = Promise.all(
//       forwardNodeIds.map((id) =>
//         this.workflowExecutionNodeRepository.findOne({
//           where: {
//             id,
//           },
//         })
//       )
//     );

//     return forwardNodes;
//   }

//   async incomingNodes(startNode: WorkflowExecutionNode): Promise<WorkflowExecutionNode[]> {
//     const incomingEdges = await this.workflowExecutionEdgeRepository.find({
//       where: {
//         targetWorkflowExecutionNode: startNode,
//       },
//     });

//     const incomingNodeIds = incomingEdges.map((edge) => edge.sourceWorkflowExecutionNodeId);

//     const receivedNodes = Promise.all(
//       incomingNodeIds.map((id) =>
//         this.workflowExecutionNodeRepository.findOne({
//           where: {
//             id,
//           },
//         })
//       )
//     );

//     return receivedNodes;
//   }

//   async previewQueryNode(
//     queryId: string,
//     nodeId: string,
//     state: object,
//     appVersion: AppVersion,
//     user: User,
//     response: Response
//   ): Promise<any> {
//     const query = await this.dataQueriesService.findOne(queryId);
//     const node = find(appVersion.definition.nodes, { id: nodeId });
//     //* beta: workflow execution's environment is "development" by default
//     const currentEnvironmentId = appVersion.currentEnvironmentId;

//     const organization: any = await dbTransactionWrap(async (manager: EntityManager) => {
//       return manager
//         .createQueryBuilder('organizations', 'organization')
//         .innerJoin('apps', 'app', 'app.organization_id = organization.id')
//         .innerJoin('app_versions', 'av', 'av.app_id = app.id')
//         .where('av.id = :appVersionId', { appVersionId: appVersion.id })
//         .getOne();
//     });

//     const constants = await this.organizationConstantsService.getConstantsForEnvironment(
//       organization.id,
//       currentEnvironmentId,
//       OrganizationConstantType.GLOBAL
//     );

//     const constantsObject = Object.fromEntries(constants.map((constant) => [constant.name, constant.value]));

//     state = { ...state, constants: constantsObject };

//     // const user = await this.userRepository.findOne(execution.executingUserId, {
//     //   relations: ['organization'],
//     // });
//     // user.organizationId = user.organization.id;
//     try {
//       void getQueryVariables(query.options, state);
//     } catch (e) {
//       console.log({ e });
//     }

//     const startingTime = moment();
//     let result: any;
//     const addLog = () => {};
//     try {
//       if (node.data.looped) {
//         const iterationValues = resolveCode({ code: node.data?.iterationValuesCode, state, addLog });

//         if (!Array.isArray(iterationValues)) throw new Error('Loop array did not resolve into an array');

//         let index = 0;
//         result = [];

//         for (const value of iterationValues) {
//           const currentTime = moment();
//           const timeTaken = currentTime.diff(startingTime);
//           if (timeTaken / 1000 > this.workflowExecutionTimeout) {
//             throw new Error('Execution stopped due to timeout');
//           }
//           const modifiedState = { ...state, value, index };
//           const options = getQueryVariables(query.options, modifiedState, addLog);
//           result.push(
//             query.kind === 'runjs'
//               ? resolveCode({ code: query.options?.code, state: modifiedState, addLog })
//               : (
//                   await this.dataQueriesService.runQuery(
//                     user,
//                     cloneDeep(query),
//                     options,
//                     response,
//                     currentEnvironmentId
//                   )
//                 )['data']
//           );

//           index++;
//         }

//         result = { status: 'ok', data: result };
//       } else {
//         const options = getQueryVariables(query.options, state, addLog);
//         result =
//           query.kind === 'runjs'
//             ? { status: 'ok', data: resolveCode({ code: query.options?.code, state, addLog }) }
//             : await this.dataQueriesService.runQuery(user, query, options, response, currentEnvironmentId);
//       }
//     } catch (exception) {
//       const result = { status: 'failed', exception };

//       return result;
//     }

//     return result;
//   }

//   computeNodeHandle(nodeData, queries, queryIdsOnDefinitionToActualQueryIdMapping): string {
//     switch (nodeData.type) {
//       case 'query': {
//         return find(queries, { id: queryIdsOnDefinitionToActualQueryIdMapping[nodeData.data.idOnDefinition] }).name;
//       }
//       default:
//         return STATIC_NODE_TYPE_TO_HANDLE_MAPPING[nodeData.type];
//     }
//   }

//   async canExecuteWorkflow(organizationId: string): Promise<{ allowed: boolean; message: string }> {
//     if (!organizationId) {
//       return { allowed: false, message: 'WorkspaceId is missing' };
//     }

//     const workflowsLimit = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.WORKFLOWS);
//     if (!workflowsLimit?.workspace || !workflowsLimit?.instance) {
//       return { allowed: false, message: 'Workflow is not enabled in the license, contact admin' };
//     }

//     return await dbTransactionWrap(async (manager) => {
//       const dailyWorkspaceCount = (
//         await manager.query(
//           `SELECT COUNT(*)
//            FROM apps a
//            INNER JOIN app_versions av on av.app_id = a.id
//            INNER JOIN workflow_executions we on we.app_version_id = av.id
//            WHERE a.organization_id = $1
//            AND extract (year from we.created_at) = extract (year from current_date)
//            AND extract (month from we.created_at) = extract (month from current_date)
//            AND DATE(we.created_at) = current_date`,
//           [organizationId]
//         )
//       )[0].count;

//       if (
//         workflowsLimit.workspace.daily_executions !== LICENSE_LIMIT.UNLIMITED &&
//         dailyWorkspaceCount >= workflowsLimit.workspace.daily_executions
//       ) {
//         return {
//           allowed: false,
//           message: 'Maximum daily limit for workflow execution has been reached for this workspace',
//         };
//       }

//       // Workspace Level - Monthly Limit
//       const monthlyWorkspaceCount = (
//         await manager.query(
//           `SELECT COUNT(*)
//            FROM apps a
//            INNER JOIN app_versions av on av.app_id = a.id
//            INNER JOIN workflow_executions we on we.app_version_id = av.id
//            WHERE a.organization_id = $1
//            AND extract (year from we.created_at) = extract (year from current_date)
//            AND extract (month from we.created_at) = extract (month from current_date)`,
//           [organizationId]
//         )
//       )[0].count;

//       if (
//         workflowsLimit.workspace.monthly_executions !== LICENSE_LIMIT.UNLIMITED &&
//         monthlyWorkspaceCount >= workflowsLimit.workspace.monthly_executions
//       ) {
//         return {
//           allowed: false,
//           message: 'Maximum monthly limit for workflow execution has been reached for this workspace',
//         };
//       }

//       // Instance Level - Daily Limit
//       const dailyInstanceCount = (
//         await manager.query(
//           `SELECT COUNT(*)
//            FROM apps a
//            INNER JOIN app_versions av on av.app_id = a.id
//            INNER JOIN workflow_executions we on we.app_version_id = av.id
//            WHERE extract (year from we.created_at) = extract (year from current_date)
//            AND extract (month from we.created_at) = extract (month from current_date)
//            AND DATE(we.created_at) = current_date`
//         )
//       )[0].count;

//       if (
//         workflowsLimit.instance.daily_executions !== LICENSE_LIMIT.UNLIMITED &&
//         dailyInstanceCount >= workflowsLimit.instance.daily_executions
//       ) {
//         return { allowed: false, message: 'Maximum daily limit for workflow execution has been reached' };
//       }

//       // Instance Level - Monthly Limit
//       const monthlyInstanceCount = (
//         await manager.query(
//           `SELECT COUNT(*)
//            FROM apps a
//            INNER JOIN app_versions av on av.app_id = a.id
//            INNER JOIN workflow_executions we on we.app_version_id = av.id
//            WHERE extract (year from we.created_at) = extract (year from current_date)
//            AND extract (month from we.created_at) = extract (month from current_date)`
//         )
//       )[0].count;

//       if (
//         workflowsLimit.instance.monthly_executions !== LICENSE_LIMIT.UNLIMITED &&
//         monthlyInstanceCount >= workflowsLimit.instance.monthly_executions
//       ) {
//         return { allowed: false, message: 'Maximum monthly limit for workflow execution has been reached' };
//       }

//       return { allowed: true, message: 'Workflow execution allowed' };
//     });
//   }
//   // Workspace Level - Daily Limit
// }
