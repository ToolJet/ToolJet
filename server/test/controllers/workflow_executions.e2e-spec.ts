/** @jest-environment setup-polly-jest/jest-environment-node */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { WorkflowExecution } from '../../src/entities/workflow_execution.entity';
import { setupPolly } from 'setup-polly-jest';
import * as NodeHttpAdapter from '@pollyjs/adapter-node-http';
import * as FSPersister from '@pollyjs/persister-fs';
import * as path from 'path';
import { parse } from 'flatted';
import {
  clearDB,
  setupOrganizationAndUser,
  createNestAppInstance,
  createCompleteWorkflow,
  createWorkflowBundle,
  authenticateUser,
  WorkflowNode,
  WorkflowEdge,
  WorkflowQuery,
} from '../workflows.helper';

const executeWorkflow = async (
  nestApp: INestApplication,
  workflow: any,
  user: any,
  options: {
    environmentId?: string;
    parameters?: Record<string, any>;
  } = {}
): Promise<any> => {
  const { tokenCookie } = await authenticateUser(nestApp, user.email);

  const response = await request(nestApp.getHttpServer())
    .post('/api/workflow_executions')
    .set('tj-workspace-id', user.defaultOrganizationId || user.organizationId)
    .set('Cookie', tokenCookie)
    .send({
      appId: workflow.id,
      executeUsing: 'app',
      userId: user.id,
      environmentId: options.environmentId,
      parameters: options.parameters
    });

  if (response.statusCode !== 201) {
    throw new Error(`Workflow execution failed: ${response.body.message || 'Unknown error'}`);
  }

  return response.body.workflowExecution;
};

const getWorkflowExecutionDetails = async (
  nestApp: INestApplication,
  executionId: string
) => {
  const defaultDataSource = nestApp.get<DataSource>(getDataSourceToken('default'));

  const workflowExecution = await defaultDataSource
    .getRepository(WorkflowExecution)
    .findOne({ where: { id: executionId } });

  if (!workflowExecution) {
    throw new Error(`Workflow execution ${executionId} not found`);
  }

  const executionNodes = await defaultDataSource
    .getRepository('WorkflowExecutionNode')
    .find({ where: { workflowExecutionId: executionId } });

  return {
    execution: workflowExecution,
    nodes: executionNodes
  };
};

/**
 * @group workflows
 */

const context = setupPolly({
  adapters: [NodeHttpAdapter as any],
  persister: FSPersister as any,
  persisterOptions: {
    fs: {
      recordingsDir: path.resolve(__dirname, '../__fixtures__/workflow-executions-e2e'),
    },
  },
  recordFailedRequests: true,
  recordIfMissing: true,
  mode: (process.env.POLLY_MODE as any) || 'replay',
  matchRequestsBy: {
    method: true,
    headers: {
      exclude: ['user-agent', 'accept-encoding', 'connection', 'host', 'cookie'],
    },
    body: true,
    url: {
      protocol: true,
      hostname: true,
      port: true,
      pathname: true,
      query: true,
    },
  },
});

let app: INestApplication;

beforeAll(async () => {
  app = await createNestAppInstance({
    edition: 'ee',
    isGetContext: true
  });
});

beforeEach(async () => {
  await clearDB(app);

  // Configure Polly.js to only pass through localhost calls
  // External API calls will be recorded
  context.polly.server
    .any()
    .filter(req => {
      const url = new URL(req.url);
      // Pass through localhost and internal calls without recording
      return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.includes('host.docker.internal');
    })
    .passthrough();
  // All other requests (external APIs) will be handled by Polly's recording mechanism
});

afterEach(async () => {
  jest.resetAllMocks();
  jest.clearAllMocks();
});

afterAll(async () => {
  if (app) await app.close();
});

describe('workflow executions controller', () => {

  describe('POST /api/workflow_executions', () => {
    describe('Basic workflow execution', () => {
      it('should execute a simple workflow with start trigger and response', async () => {
        const { user } = await setupOrganizationAndUser(app, {
          email: 'admin@tooljet.io',
          password: 'password',
          firstName: 'Admin',
          lastName: 'User'
        });

        const nodes: WorkflowNode[] = [
          {
            id: 'start-1',
            type: 'input',
            data: { nodeType: 'start', label: 'Start trigger' },
            position: { x: 100, y: 250 },
            sourcePosition: 'right'
          },
          {
            id: 'response-1',
            type: 'output',
            data: {
              nodeType: 'response',
              label: 'Response',
              code: 'return { message: "Workflow executed successfully" }',
              nodeName: 'response1'
            },
            position: { x: 400, y: 250 },
            targetPosition: 'left'
          }
        ];

        const edges: WorkflowEdge[] = [
          {
            id: 'edge-1',
            source: 'start-1',
            target: 'response-1',
            type: 'workflow'
          }
        ];

        const { app: workflow, appVersion } = await createCompleteWorkflow(app, user, {
          name: 'Basic Workflow',
          nodes,
          edges,
          queries: []
        });

        const execution = await executeWorkflow(app, workflow, user, {
          environmentId: appVersion.currentEnvironmentId
        });

        // Get workflow execution details
        const { execution: workflowExecution, nodes: executionNodes } = await getWorkflowExecutionDetails(app, execution.id);

        // Verify execution status
        expect(workflowExecution.executed).toBe(true);
        expect(execution.id).toBeDefined();
        expect(execution.appVersionId).toBe(appVersion.id);

        // Verify nodes executed
        const executedNodes = executionNodes.filter((n: any) => n.executed);
        const executedNodeIds = executedNodes.map((n: any) => n.idOnWorkflowDefinition);
        expect(executedNodeIds).toContain('start-1');

        // Verify response node result contains expected message
        const responseNode = executionNodes.find((n: any) => n.idOnWorkflowDefinition === 'response-1');
        expect(responseNode).toBeDefined();
        expect(responseNode.executed).toBe(true);

        const responseResult = JSON.parse(responseNode.result);
        expect(responseResult).toContain('Workflow executed successfully');
      });
    });
  });

  describe('Workflow with query nodes', () => {
    it('should execute workflow with RunJS query node', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User'
      });

      const nodes: WorkflowNode[] = [
        {
          id: 'start-1',
          type: 'input',
          data: { nodeType: 'start', label: 'Start trigger' },
          position: { x: 100, y: 250 },
          sourcePosition: 'right'
        },
        {
          id: 'runjs-1',
          type: 'query',
          data: {
            idOnDefinition: 'query-runjs-1',
            kind: 'runjs',
            options: {}
          },
          position: { x: 350, y: 250 },
          sourcePosition: 'right',
          targetPosition: 'left'
        },
        {
          id: 'response-1',
          type: 'output',
          data: {
            nodeType: 'response',
            label: 'Response',
            code: 'return { result: runjs1.data }',
            nodeName: 'response1'
          },
          position: { x: 600, y: 250 },
          targetPosition: 'left'
        }
      ];

      const edges: WorkflowEdge[] = [
        {
          id: 'edge-1',
          source: 'start-1',
          target: 'runjs-1',
          type: 'workflow'
        },
        {
          id: 'edge-2',
          source: 'runjs-1',
          target: 'response-1',
          type: 'workflow'
        }
      ];

      const queries: WorkflowQuery[] = [
        {
          idOnDefinition: 'query-runjs-1',
          dataSourceKind: 'runjs',
          name: 'runjs1',
          options: {
            code: `
              const numbers = [1, 2, 3, 4, 5];
              const sum = numbers.reduce((acc, val) => acc + val, 0);
              return { sum: sum, numbers: numbers };
            `,
            parameters: []
          }
        }
      ];

      const { app: workflow, appVersion } = await createCompleteWorkflow(app, user, {
        name: 'RunJS Workflow',
        nodes,
        edges,
        queries
      });

      const execution = await executeWorkflow(app, workflow, user, {
        environmentId: appVersion.currentEnvironmentId
      });

      // Get workflow execution details
      const { execution: workflowExecution, nodes: executionNodes } = await getWorkflowExecutionDetails(app, execution.id);

      // Verify execution status
      expect(workflowExecution.executed).toBe(true);

      // Verify nodes executed
      const executedNodes = executionNodes.filter((n: any) => n.executed);
      const executedNodeIds = executedNodes.map((n: any) => n.idOnWorkflowDefinition);
      expect(executedNodeIds).toContain('start-1');
      expect(executedNodeIds).toContain('runjs-1');

      // Verify RunJS node result contains the numbers array
      const runjsNode = executionNodes.find((n: any) => n.idOnWorkflowDefinition === 'runjs-1');
      expect(runjsNode).toBeDefined();
      expect(runjsNode.executed).toBe(true);

      const runjsResult = JSON.parse(runjsNode.result);
      expect(runjsResult).toEqual(expect.arrayContaining([[1, 2, 3, 4, 5]]));

      // Verify response node result contains the numbers array
      const responseNode = executionNodes.find((n: any) => n.idOnWorkflowDefinition === 'response-1');
      expect(responseNode).toBeDefined();
      expect(responseNode.executed).toBe(true);

      const responseResult = JSON.parse(responseNode.result);
      expect(responseResult).toEqual(expect.arrayContaining([[1, 2, 3, 4, 5]]));
    });

    it('should execute workflow with REST API query node', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User'
      });

      const nodes: WorkflowNode[] = [
        {
          id: 'start-1',
          type: 'input',
          data: { nodeType: 'start', label: 'Start trigger' },
          position: { x: 100, y: 250 },
          sourcePosition: 'right'
        },
        {
          id: 'restapi-1',
          type: 'query',
          data: {
            idOnDefinition: 'query-restapi-1',
            kind: 'restapi',
            options: {}
          },
          position: { x: 350, y: 250 },
          sourcePosition: 'right',
          targetPosition: 'left'
        },
        {
          id: 'response-1',
          type: 'output',
          data: {
            nodeType: 'response',
            label: 'Response',
            code: 'return { data: restapi1.data }',
            nodeName: 'response1'
          },
          position: { x: 600, y: 250 },
          targetPosition: 'left'
        }
      ];

      const edges: WorkflowEdge[] = [
        {
          id: 'edge-1',
          source: 'start-1',
          target: 'restapi-1',
          type: 'workflow'
        },
        {
          id: 'edge-2',
          source: 'restapi-1',
          target: 'response-1',
          type: 'workflow'
        }
      ];

      const queries: WorkflowQuery[] = [
        {
          idOnDefinition: 'query-restapi-1',
          dataSourceKind: 'restapi',
          name: 'restapi1',
          options: {
            method: 'get',
            url: 'https://jsonplaceholder.typicode.com/users/1',
            headers: [['Accept', 'application/json']],
            body: [['', '']],
            url_params: [['', '']],
            cookies: [['', '']],
            json_body: null,
            body_toggle: false,
            transformationLanguage: 'javascript',
            enableTransformation: false,
            raw_body: null,
            arrayValuesChanged: true
          }
        }
      ];

      const { app: workflow, appVersion } = await createCompleteWorkflow(app, user, {
        name: 'REST API Workflow',
        nodes,
        edges,
        queries
      });

      const execution = await executeWorkflow(app, workflow, user, {
        environmentId: appVersion.currentEnvironmentId
      });

      // Get workflow execution details
      const { execution: workflowExecution, nodes: executionNodes } = await getWorkflowExecutionDetails(app, execution.id);

      // Verify execution status
      expect(workflowExecution.executed).toBe(true);

      // Verify nodes executed
      const executedNodes = executionNodes.filter((n: any) => n.executed);
      const executedNodeIds = executedNodes.map((n: any) => n.idOnWorkflowDefinition);
      expect(executedNodeIds).toContain('start-1');
      expect(executedNodeIds).toContain('restapi-1');

      // Verify REST API node executed and has result
      const restapiNode = executionNodes.find((n: any) => n.idOnWorkflowDefinition === 'restapi-1');
      expect(restapiNode).toBeDefined();
      expect(restapiNode.executed).toBe(true);
      expect(restapiNode.result).toBeTruthy();

      // Parse and validate REST API response
      const restapiResult = JSON.parse(restapiNode.result);
      expect(Array.isArray(restapiResult)).toBe(true);
      expect(restapiResult.length).toBeGreaterThan(0);

      // The result should contain status and data info - check for 'ok' status
      expect(restapiResult).toContain('ok');

      // Find the user data object in the result array
      const userData = restapiResult.find((item: any) =>
        typeof item === 'object' && item !== null && item.hasOwnProperty('id')
      );
      expect(userData).toBeDefined();

      // Validate the JSONPlaceholder user data structure
      expect(userData).toHaveProperty('id', 1);
      expect(userData).toHaveProperty('name');
      expect(userData).toHaveProperty('username');
      expect(userData).toHaveProperty('email');
      expect(userData).toHaveProperty('address');
      expect(userData).toHaveProperty('phone');
      expect(userData).toHaveProperty('website');
      expect(userData).toHaveProperty('company');

      // Verify specific expected values from JSONPlaceholder user 1
      expect(restapiResult).toContain('Leanne Graham');
      expect(restapiResult).toContain('Bret');
      expect(restapiResult).toContain('Sincere@april.biz');

      // Verify response node executed successfully
      const responseNode = executionNodes.find((n: any) => n.idOnWorkflowDefinition === 'response-1');
      expect(responseNode).toBeDefined();
      expect(responseNode.executed).toBe(true);
      expect(responseNode.result).toBeTruthy();

      // Parse and validate response node result
      const responseResult = JSON.parse(responseNode.result);
      expect(Array.isArray(responseResult)).toBe(true);
      expect(responseResult.length).toBeGreaterThan(0);

      // Response should contain the user data
      expect(responseResult).toContain('Leanne Graham');
      expect(responseResult).toContain('Bret');
    });
  });

  describe('NPM package support', () => {
    it('should execute workflow with setup script using lodash', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User'
      });

      const setupScript = `
          const _ = require('lodash');
          global.processNumbers = (numbers) => ({
            sum: _.sum(numbers),
            max: _.max(numbers),
            min: _.min(numbers),
            sorted: _.sortBy(numbers)
          });
        `;

      const dependencies = {
        'lodash': '4.17.21'
      };

      const nodes: WorkflowNode[] = [
        {
          id: 'start-1',
          type: 'input',
          data: { nodeType: 'start', label: 'Start trigger' },
          position: { x: 100, y: 250 },
          sourcePosition: 'right'
        },
        {
          id: 'runjs-1',
          type: 'query',
          data: {
            idOnDefinition: 'query-runjs-lodash',
            kind: 'runjs',
            options: {}
          },
          position: { x: 350, y: 250 },
          sourcePosition: 'right',
          targetPosition: 'left'
        },
        {
          id: 'response-1',
          type: 'output',
          data: {
            nodeType: 'response',
            label: 'Response',
            code: 'return { result: runjs1.data }',
            nodeName: 'response1'
          },
          position: { x: 600, y: 250 },
          targetPosition: 'left'
        }
      ];

      const edges: WorkflowEdge[] = [
        {
          id: 'edge-1',
          source: 'start-1',
          target: 'runjs-1',
          type: 'workflow'
        },
        {
          id: 'edge-2',
          source: 'runjs-1',
          target: 'response-1',
          type: 'workflow'
        }
      ];

      const queries: WorkflowQuery[] = [
        {
          idOnDefinition: 'query-runjs-lodash',
          dataSourceKind: 'runjs',
          name: 'runjs1',
          options: {
            code: `
              const numbers = [10, 5, 8, 3, 12, 7];
              return processNumbers(numbers);
            `,
            parameters: []
          }
        }
      ];

      const { app: workflow, appVersion } = await createCompleteWorkflow(app, user, {
        name: 'NPM Package Workflow',
        setupScript,
        dependencies,
        nodes,
        edges,
        queries
      });

      await createWorkflowBundle(app, appVersion.id, dependencies);

      const execution = await executeWorkflow(app, workflow, user, {
        environmentId: appVersion.currentEnvironmentId
      });

      // Get workflow execution details
      const { execution: workflowExecution, nodes: executionNodes } = await getWorkflowExecutionDetails(app, execution.id);

      // Verify execution status
      expect(workflowExecution.executed).toBe(true);

      // Verify nodes executed
      const executedNodes = executionNodes.filter((n: any) => n.executed);
      const executedNodeIds = executedNodes.map((n: any) => n.idOnWorkflowDefinition);
      expect(executedNodeIds).toContain('start-1');
      expect(executedNodeIds).toContain('runjs-1');

      // Verify RunJS node executed and has result
      const runjsNode = executionNodes.find((n: any) => n.idOnWorkflowDefinition === 'runjs-1');
      expect(runjsNode).toBeDefined();
      expect(runjsNode.executed).toBe(true);

      console.log('RunJS Node Result:', runjsNode.result);

      // Parse the flatted-encoded result and verify the actual object structure
      const parsedResult = parse(runjsNode.result);
      expect(parsedResult).toMatchObject({
        data: {
          sum: 45,
          max: 12,
          min: 3,
          sorted: [3, 5, 7, 8, 10, 12]
        },
        status: "ok"
      });

      // Verify response node contains the lodash results
      const responseNode = executionNodes.find((n: any) => n.idOnWorkflowDefinition === 'response-1');
      expect(responseNode).toBeDefined();
      expect(responseNode.executed).toBe(true);

      // Parse the response node result and verify it contains the same lodash results
      const parsedResponseResult = parse(responseNode.result);
      expect(parsedResponseResult).toMatchObject({
        data: {
          result: {
            sum: 45,
            max: 12,
            min: 3,
            sorted: [3, 5, 7, 8, 10, 12]
          }
        },
        status: "ok"
      });
    });
  });
});

describe('GET /api/workflow_executions/:id/status', () => {
  it('should retrieve workflow execution status', async () => {
    const { user } = await setupOrganizationAndUser(app, {
      email: 'admin@tooljet.io',
      password: 'password',
      firstName: 'Admin',
      lastName: 'User'
    });

    const { app: workflow, appVersion } = await createCompleteWorkflow(app, user, {
      name: 'Status Check Workflow',
      nodes: [
        {
          id: 'start-1',
          type: 'input',
          data: { nodeType: 'start', label: 'Start trigger' },
          position: { x: 100, y: 250 },
          sourcePosition: 'right'
        }
      ],
      edges: [],
      queries: []
    });

    const execution = await executeWorkflow(app, workflow, user, {
      environmentId: appVersion.currentEnvironmentId
    });

    const { tokenCookie } = await authenticateUser(app, user.email);

    const statusResponse = await request(app.getHttpServer())
      .get(`/api/workflow_executions/${execution.id}/status`)
      .set('tj-workspace-id', user.defaultOrganizationId)
      .set('Cookie', tokenCookie);

    expect(statusResponse.statusCode).toBe(200);
    expect(statusResponse.body).toHaveProperty('status');
  });
});

describe('GET /api/workflow_executions/:id', () => {
  it('should retrieve workflow execution details including logs', async () => {
    const { user } = await setupOrganizationAndUser(app, {
      email: 'admin@tooljet.io',
      password: 'password',
      firstName: 'Admin',
      lastName: 'User'
    });

    const { app: workflow, appVersion } = await createCompleteWorkflow(app, user, {
      name: 'Details Check Workflow',
      nodes: [
        {
          id: 'start-1',
          type: 'input',
          data: { nodeType: 'start', label: 'Start trigger' },
          position: { x: 100, y: 250 },
          sourcePosition: 'right'
        }
      ],
      edges: [],
      queries: []
    });

    const execution = await executeWorkflow(app, workflow, user, {
      environmentId: appVersion.currentEnvironmentId
    });

    const { tokenCookie } = await authenticateUser(app, user.email);

    const detailsResponse = await request(app.getHttpServer())
      .get(`/api/workflow_executions/${execution.id}`)
      .set('tj-workspace-id', user.defaultOrganizationId)
      .set('Cookie', tokenCookie);

    expect(detailsResponse.statusCode).toBe(200);
    expect(detailsResponse.body).toHaveProperty('id');
    expect(detailsResponse.body.id).toBe(execution.id);
  });
});

describe('GET /api/workflow_executions/all/:appVersionId', () => {
  it('should list all executions for an app version', async () => {
    const { user } = await setupOrganizationAndUser(app, {
      email: 'admin@tooljet.io',
      password: 'password',
      firstName: 'Admin',
      lastName: 'User'
    });

    const { app: workflow, appVersion } = await createCompleteWorkflow(app, user, {
      name: 'List Executions Workflow',
      nodes: [
        {
          id: 'start-1',
          type: 'input',
          data: { nodeType: 'start', label: 'Start trigger' },
          position: { x: 100, y: 250 },
          sourcePosition: 'right'
        }
      ],
      edges: [],
      queries: []
    });

    // Execute workflow twice
    await executeWorkflow(app, workflow, user, {
      environmentId: appVersion.currentEnvironmentId
    });

    await executeWorkflow(app, workflow, user, {
      environmentId: appVersion.currentEnvironmentId
    });

    const { tokenCookie } = await authenticateUser(app, user.email);

    const listResponse = await request(app.getHttpServer())
      .get(`/api/workflow_executions/all/${appVersion.id}`)
      .set('tj-workspace-id', user.defaultOrganizationId)
      .set('Cookie', tokenCookie);

    expect(listResponse.statusCode).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.length).toBe(2);
  });
});

describe('GET /api/workflow_executions', () => {
  it('should retrieve paginated execution logs', async () => {
    const { user } = await setupOrganizationAndUser(app, {
      email: 'admin@tooljet.io',
      password: 'password',
      firstName: 'Admin',
      lastName: 'User'
    });

    const { app: workflow, appVersion } = await createCompleteWorkflow(app, user, {
      name: 'Pagination Test Workflow',
      nodes: [
        {
          id: 'start-1',
          type: 'input',
          data: { nodeType: 'start', label: 'Start trigger' },
          position: { x: 100, y: 250 },
          sourcePosition: 'right'
        }
      ],
      edges: [],
      queries: []
    });

    // Execute workflow multiple times
    for (let i = 0; i < 3; i++) {
      await executeWorkflow(app, workflow, user, {
        environmentId: appVersion.currentEnvironmentId
      });
    }

    const { tokenCookie } = await authenticateUser(app, user.email);

    const logsResponse = await request(app.getHttpServer())
      .get(`/api/workflow_executions?appVersionId=${appVersion.id}&page=1&per_page=2`)
      .set('tj-workspace-id', user.defaultOrganizationId)
      .set('Cookie', tokenCookie);

    expect(logsResponse.statusCode).toBe(200);
    expect(logsResponse.body).toHaveProperty('data');
    expect(Array.isArray(logsResponse.body.data)).toBe(true);
  });
});

describe('GET /api/workflow_executions/:id/nodes', () => {
  it('should retrieve execution nodes with pagination', async () => {
    const { user } = await setupOrganizationAndUser(app, {
      email: 'admin@tooljet.io',
      password: 'password',
      firstName: 'Admin',
      lastName: 'User'
    });

    const nodes: WorkflowNode[] = [
      {
        id: 'start-1',
        type: 'input',
        data: { nodeType: 'start', label: 'Start trigger' },
        position: { x: 100, y: 250 },
        sourcePosition: 'right'
      },
      {
        id: 'runjs-1',
        type: 'query',
        data: {
          idOnDefinition: 'query-runjs-1',
          kind: 'runjs',
          options: {}
        },
        position: { x: 350, y: 250 },
        sourcePosition: 'right',
        targetPosition: 'left'
      }
    ];

    const edges: WorkflowEdge[] = [
      {
        id: 'edge-1',
        source: 'start-1',
        target: 'runjs-1',
        type: 'workflow'
      }
    ];

    const queries: WorkflowQuery[] = [
      {
        idOnDefinition: 'query-runjs-1',
        dataSourceKind: 'runjs',
        name: 'runjs1',
        options: {
          code: `return { message: "Hello from RunJS" };`,
          parameters: []
        }
      }
    ];

    const { app: workflow, appVersion } = await createCompleteWorkflow(app, user, {
      name: 'Nodes Test Workflow',
      nodes,
      edges,
      queries
    });

    const execution = await executeWorkflow(app, workflow, user, {
      environmentId: appVersion.currentEnvironmentId
    });

    const { tokenCookie } = await authenticateUser(app, user.email);

    const nodesResponse = await request(app.getHttpServer())
      .get(`/api/workflow_executions/${execution.id}/nodes?page=1&per_page=10`)
      .set('tj-workspace-id', user.defaultOrganizationId)
      .set('Cookie', tokenCookie);

    expect(nodesResponse.statusCode).toBe(200);
    expect(nodesResponse.body).toHaveProperty('data');
    expect(Array.isArray(nodesResponse.body.data)).toBe(true);
  });
});
