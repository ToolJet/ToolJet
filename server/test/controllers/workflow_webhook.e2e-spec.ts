import { INestApplication } from '@nestjs/common';
import { getManager } from 'typeorm';
import {
  clearDB,
  createUser,
  createNestAppInstance,
  authenticateUser,
  createApplication,
  createApplicationVersion,
  enableWebhookForWorkflows,
  getWorkflowWebhookApiToken,
  triggerWorkflowViaWebhook,
  enableWorkflowStatus,
  createNestAppInstanceWithServiceMocks,
} from '../test.helper';
import { v4 as uuidv4 } from 'uuid';
import * as request from 'supertest';
import { LICENSE_FIELD } from '@modules/licensing/helper';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
import { WorkflowExecutionNode } from 'src/entities/workflow_execution_node.entity';

const checkIfRunjsQueryCanAccessParamsPassedFromWebhook = async (appId: string, appVersionId: string) => {
  return await getManager()
    .createQueryBuilder(WorkflowExecution, 'we')
    .innerJoinAndSelect(WorkflowExecutionNode, 'wen', 'wen.workflowExecutionId = we.id')
    .where('we.appVersionId = :appVerId and wen.type = :type', {
      appVerId: appVersionId,
      type: 'query',
      isExecuted: true,
    })
    .select(['wen.result'])
    .orderBy('we.created_at', 'DESC')
    .limit(1)
    .execute();
};

const prepareSampleWorlflowDefinition = (shouldIncludeWebhookParams: boolean) => {
  return {
    definition: {
      nodes: [
        {
          id: '4ecd2bb5-4a9c-46b5-bdcc-e56d98a7d981',
          data: { nodeType: 'start', label: 'Start trigger' },
          position: { x: 136, y: 78 },
          type: 'input',
          sourcePosition: 'right',
          deletable: false,
          width: 144,
          height: 106,
          selected: false,
          positionAbsolute: {
            x: 136,
            y: 78,
          },
          dragging: false,
        },
        {
          id: '5fbb3848-d22f-49c2-a83c-f67f21ea75cd',
          data: { nodeType: 'result', label: 'Result' },
          position: { x: 415, y: 79 },
          type: 'output',
          targetPosition: 'left',
          deletable: false,
          width: 144,
          height: 52,
          selected: true,
          positionAbsolute: {
            x: 415,
            y: 79,
          },
          dragging: false,
        },
      ],
      edges: [
        {
          source: '4ecd2bb5-4a9c-46b5-bdcc-e56d98a7d981',
          sourceHandle: null,
          target: '5fbb3848-d22f-49c2-a83c-f67f21ea75cd',
          targetHandle: null,
          id: 'reactflow__edge-4ecd2bb5-4a9c-46b5-bdcc-e56d98a7d981-5fbb3848-d22f-49c2-a83c-f67f21ea75cd',
        },
      ],
      ...(shouldIncludeWebhookParams && {
        webhookParams: [
          {
            key: 'name',
            dataType: 'string',
          },
        ],
      }),
    },
  };
};

describe('Workflow and Webhooks - License Expiry scenarios', () => {
  let app: INestApplication;
  let licenseServiceMock;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    ({ app, licenseServiceMock } = await createNestAppInstanceWithServiceMocks({
      shouldMockLicenseService: true,
    }));
  });

  describe('Workflows flow', () => {
    beforeEach(() => {
      jest.spyOn(licenseServiceMock, 'getLicenseTerms').mockImplementation((key: LICENSE_FIELD) => {
        switch (key) {
          case LICENSE_FIELD.VALID:
            return false;
          case LICENSE_FIELD.IS_EXPIRED:
            return true;
        }
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
    });

    it('Should not create workflow - When License got expired', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      const createAppResponse = await request(app.getHttpServer())
        .post('/api/apps')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({
          icon: 'home',
          name: 'Sample workflow',
          type: 'workflow',
        });
      const { statusCode, message } = createAppResponse.body;

      expect(message).toBe('Workflows are available only in paid plans');
      expect(statusCode).toBe(451);
    });

    it('Should not be able to Run workflow from workflow dashboard - When License got expired', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
      const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(false);
      await createApplicationVersion(app, workflow, sampleWorkflowDefinition);

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      // Enabling workflow
      const enableWorkflowStatusResponse = await enableWorkflowStatus(
        app,
        workflow?.id,
        user.defaultOrganizationId,
        userData['tokenCookie'],
        true
      );

      expect(enableWorkflowStatusResponse.statusCode).toBe(200);

      const response = await request(app.getHttpServer())
        .post('/api/workflow_executions')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({ appId: workflow.id, executeUsing: 'app', userId: user.id });

      const { statusCode, message } = response.body;

      expect(message).toBe('Not allowed in basic plan');
      expect(statusCode).toBe(451);
    });
  });

  describe('Webhooks flow', () => {
    beforeEach(() => {
      jest.spyOn(licenseServiceMock, 'getLicenseTerms').mockImplementation((key: LICENSE_FIELD) => {
        switch (key) {
          case LICENSE_FIELD.VALID:
            return false;
          case LICENSE_FIELD.IS_EXPIRED:
            return true;
        }
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it('Should not be able to enable Webhooks - when License got expired', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
      const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(false);
      await createApplicationVersion(app, workflow, sampleWorkflowDefinition);

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      // Enabling workflow
      const enableWorkflowStatusResponse = await enableWorkflowStatus(
        app,
        workflow?.id,
        user.defaultOrganizationId,
        userData['tokenCookie'],
        true
      );
      expect(enableWorkflowStatusResponse.statusCode).toBe(200);

      const response = await request(app.getHttpServer())
        .patch(`/api/v2/webhooks/workflows/${workflow.id}`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({ isEnable: true });
      const { statusCode, message } = response.body;

      expect(message).toBe('Not allowed in basic plan');
      expect(statusCode).toBe(451);
    });

    it('Should not be able to trigger Webhooks - when License got expired', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
      const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(false);
      await createApplicationVersion(app, workflow, sampleWorkflowDefinition);

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      // Enabling workflow
      const enableWorkflowStatusResponse = await enableWorkflowStatus(
        app,
        workflow?.id,
        user.defaultOrganizationId,
        userData['tokenCookie'],
        true
      );

      expect(enableWorkflowStatusResponse.statusCode).toBe(200);

      await enableWebhookForWorkflows(workflow.id);
      const workflowWebhookApiToken = await getWorkflowWebhookApiToken(workflow?.id ?? '');
      const response = await triggerWorkflowViaWebhook(app, workflowWebhookApiToken, workflow?.id, 'development');
      const { statusCode, message } = response.body;

      expect(message).toBe('Not allowed in basic plan');
      expect(statusCode).toBe(451);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

describe('Workflow : Webhook Controller - POST api/v2/webhooks/workflows/<workflowId>/trigger', () => {
  jest.setTimeout(20000);
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  describe('Access workflow from webhook without params', () => {
    it('trigger workflows from webhook', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
      const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(false);
      await createApplicationVersion(app, workflow, sampleWorkflowDefinition);

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      // Enabling workflow
      const enableWorkflowStatusResponse = await enableWorkflowStatus(
        app,
        workflow?.id,
        user.defaultOrganizationId,
        userData['tokenCookie'],
        true
      );
      expect(enableWorkflowStatusResponse.statusCode).toBe(200);

      await enableWebhookForWorkflows(workflow.id);
      const workflowWebhookApiToken = await getWorkflowWebhookApiToken(workflow?.id ?? '');
      const response = await triggerWorkflowViaWebhook(app, workflowWebhookApiToken, workflow?.id, 'development');
      const { message } = response.body;

      expect(message).toBe('Workflow successfully started');
      expect(response.statusCode).toBe(201);
    });

    it('should not trigger workflows from webhook when it is not enabled', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
      const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(false);
      await createApplicationVersion(app, workflow, sampleWorkflowDefinition);

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      // Enabling workflow
      const enableWorkflowStatusResponse = await enableWorkflowStatus(
        app,
        workflow?.id,
        user.defaultOrganizationId,
        userData['tokenCookie'],
        true
      );
      expect(enableWorkflowStatusResponse.statusCode).toBe(200);

      await enableWebhookForWorkflows(workflow.id, false);
      const workflowWebhookApiToken = await getWorkflowWebhookApiToken(workflow?.id ?? '');
      const response = await triggerWorkflowViaWebhook(app, workflowWebhookApiToken, workflow?.id, 'development');
      const { message, statusCode } = response.body;

      expect(message).toBe(`Webhook endpoint disabled or doesn't exists`);
      expect(statusCode).toBe(404);
    });
  });

  describe('Access workflow from webhook with params', () => {
    it('trigger workflows from webhook with valid parameters and its type', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
      const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(true);
      await createApplicationVersion(app, workflow, sampleWorkflowDefinition);

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      // Enabling workflow
      const enableWorkflowStatusResponse = await enableWorkflowStatus(
        app,
        workflow?.id,
        user.defaultOrganizationId,
        userData['tokenCookie'],
        true
      );
      expect(enableWorkflowStatusResponse.statusCode).toBe(200);

      await enableWebhookForWorkflows(workflow.id);
      const workflowWebhookApiToken = await getWorkflowWebhookApiToken(workflow?.id ?? '');
      const response = await triggerWorkflowViaWebhook(app, workflowWebhookApiToken, workflow?.id, 'development', {
        name: 'Admin',
      });
      const { message } = response.body;

      expect(message).toBe('Workflow successfully started');
      expect(response.statusCode).toBe(201);
    });

    it('should not trigger workflows from webhook without valid parameters and its type', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
      const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(true);
      await createApplicationVersion(app, workflow, sampleWorkflowDefinition);

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      // Enabling workflow
      const enableWorkflowStatusResponse = await enableWorkflowStatus(
        app,
        workflow?.id,
        user.defaultOrganizationId,
        userData['tokenCookie'],
        true
      );
      expect(enableWorkflowStatusResponse.statusCode).toBe(200);

      await enableWebhookForWorkflows(workflow.id);
      const workflowWebhookApiToken = await getWorkflowWebhookApiToken(workflow?.id ?? '');
      // Invalid params -> name should be string but below it is number. So workflow should not execute
      const response = await triggerWorkflowViaWebhook(app, workflowWebhookApiToken, workflow?.id, 'development', {
        name: 2,
      });
      const { message, statusCode } = response.body;

      expect(message).toBe('name has incorrect datatype');
      expect(statusCode).toBe(400);
    });

    it('should not trigger workflows from webhook when wrong environment is given as input', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
      const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(true);
      await createApplicationVersion(app, workflow, sampleWorkflowDefinition);

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      // Enabling workflow
      const enableWorkflowStatusResponse = await enableWorkflowStatus(
        app,
        workflow?.id,
        user.defaultOrganizationId,
        userData['tokenCookie'],
        true
      );
      expect(enableWorkflowStatusResponse.statusCode).toBe(200);

      await enableWebhookForWorkflows(workflow.id);
      const workflowWebhookApiToken = await getWorkflowWebhookApiToken(workflow?.id ?? '');
      const response = await triggerWorkflowViaWebhook(app, workflowWebhookApiToken, workflow?.id, 'developmen', {
        name: 'Admin',
      });
      const { message } = response.body;

      expect(message).toBe('Invalid environment');
      expect(response.statusCode).toBe(404);
    });

    it('should not trigger workflows from webhook when params are declared, but not given as input', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
      const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(true);
      await createApplicationVersion(app, workflow, sampleWorkflowDefinition);

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      // Enabling workflow
      const enableWorkflowStatusResponse = await enableWorkflowStatus(
        app,
        workflow?.id,
        user.defaultOrganizationId,
        userData['tokenCookie'],
        true
      );
      expect(enableWorkflowStatusResponse.statusCode).toBe(200);

      await enableWebhookForWorkflows(workflow.id);
      const workflowWebhookApiToken = await getWorkflowWebhookApiToken(workflow?.id ?? '');
      const response = await triggerWorkflowViaWebhook(app, workflowWebhookApiToken, workflow?.id, 'development', {});
      const { message } = response.body;

      expect(message).toBe('Params - name is missing');
      expect(response.statusCode).toBe(400);
    });

    it('should trigger workflows from webhooks, with Runjs node accessing params passed as input', async () => {
      const startNodeId = uuidv4();
      const resultNodeId = uuidv4();
      const runjsQueryNodeId = uuidv4();
      const runjsQueryIdOnDefinition = uuidv4();
      const paramsName = `Admin test`;

      let workflowDefinition: any = {
        definition: {
          nodes: [
            {
              id: startNodeId,
              data: { nodeType: 'start', label: 'Start trigger' },
              position: { x: 100, y: 250 },
              type: 'input',
              sourcePosition: 'right',
              deletable: false,
              width: 144,
              height: 106,
              selected: false,
              positionAbsolute: {
                x: 144,
                y: 52,
              },
              dragging: false,
            },
            {
              id: resultNodeId,
              data: { nodeType: 'result', label: 'Result' },
              position: { x: 650, y: 250 },
              type: 'output',
              targetPosition: 'left',
              deletable: false,
              width: 144,
              height: 52,
              selected: false,
              positionAbsolute: {
                x: 415,
                y: 79,
              },
              dragging: false,
            },
          ],
          edges: [],
          queries: [],
          webhookParams: [
            {
              key: 'name',
              dataType: 'string',
            },
          ],
        },
      };

      const runjsNodeDef = {
        id: runjsQueryNodeId,
        type: 'query',
        sourcePosition: 'right',
        targetPosition: 'left',
        draggable: true,
        data: {
          idOnDefinition: runjsQueryIdOnDefinition,
          kind: 'runjs',
          options: {},
        },
        position: {
          x: 267.5,
          y: 257.5,
        },
        deletable: false,
        width: 144,
        height: 52,
        selected: true,
        dragging: false,
      };

      const connectEdgesDef = [
        {
          id: 'e3f6f550-b56a-4e97-9565-efe5bb8df3a9',
          source: startNodeId,
          target: runjsQueryNodeId,
          sourceHandle: null,
        },
        {
          source: runjsQueryNodeId,
          sourceHandle: null,
          target: resultNodeId,
          targetHandle: null,
          id: `reactflow__edge-${runjsQueryNodeId}-${resultNodeId}`,
        },
      ];

      // Create workflow app -> Create app version with Start and End Nodes
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
      const appVersionDetails = await createApplicationVersion(app, workflow, workflowDefinition);

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      // Add Runjs Data-source with JS Code -> Get the dataQueriesId from response
      const updateRunjsQueryDetailsResponse = await request(app.getHttpServer())
        .post('/api/data_queries')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({
          app_id: workflow.id,
          app_version_id: appVersionDetails.id,
          name: 'runjs1',
          kind: 'runjs',
          data_source_id: null,
          options: { code: `return startTrigger.params.name` },
        });

      expect(updateRunjsQueryDetailsResponse.statusCode).toBe(201);

      const queriesdef = [
        {
          idOnDefinition: runjsQueryIdOnDefinition,
          id: updateRunjsQueryDetailsResponse.body.id,
        },
      ];

      workflowDefinition = {
        definition: {
          ...workflowDefinition.definition,
          nodes: [...workflowDefinition.definition.nodes, { ...runjsNodeDef }],
          edges: [...connectEdgesDef],
          queries: [...queriesdef],
          webhookParams: [...workflowDefinition.definition.webhookParams],
        },
      };

      // Update Workflow definition with Edges connected & Query details
      const updateWorkflowDefinition = await request(app.getHttpServer())
        .put(`/api/apps/${workflow.id}/versions/${appVersionDetails.id}`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({ definition: { ...workflowDefinition.definition }, is_user_switched_version: false });
      expect(updateWorkflowDefinition.statusCode).toBe(200);

      // Enabling workflow
      const enableWorkflowStatusResponse = await enableWorkflowStatus(
        app,
        workflow?.id,
        user.defaultOrganizationId,
        userData['tokenCookie'],
        true
      );
      expect(enableWorkflowStatusResponse.statusCode).toBe(200);

      // Enabling Webhook for workflow & Trigger Workflow using Webhook endpoint
      await enableWebhookForWorkflows(workflow.id, true);
      const workflowWebhookApiToken = await getWorkflowWebhookApiToken(workflow?.id ?? '');
      const response = await triggerWorkflowViaWebhook(app, workflowWebhookApiToken, workflow?.id, 'development', {
        name: paramsName,
      });
      expect(response.statusCode).toBe(201);

      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      await wait(5000);

      // Verify that Runjs node can access the Params passed
      const runjsParsedResult = await checkIfRunjsQueryCanAccessParamsPassedFromWebhook(
        workflow.id,
        appVersionDetails.id
      );

      expect(runjsParsedResult[0]['wen_result'].replace(/^"(.*)"$/, '$1')).toBe(paramsName);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

describe('Workflow and Webhooks - Rate Limit exceeding scenarios', () => {
  let app: INestApplication;
  let licenseServiceMock;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    ({ app, licenseServiceMock } = await createNestAppInstanceWithServiceMocks({
      shouldMockLicenseService: true,
    }));
  });

  describe('Wokflow Creation : App Limit Reached at Workspace level', () => {
    beforeEach(() => {
      jest.spyOn(licenseServiceMock, 'getLicenseTerms').mockImplementation((key: LICENSE_FIELD) => {
        switch (key) {
          case LICENSE_FIELD.VALID:
            return true;
          case LICENSE_FIELD.IS_EXPIRED:
            return false;
          case LICENSE_FIELD.WORKFLOWS:
            return {
              execution_timeout: 60,
              workspace: {
                total: 0,
                daily_executions: 500,
                monthly_executions: 10000,
              },
              instance: {
                total: 1000,
                daily_executions: 25000,
                monthly_executions: 50000,
              },
            };
        }
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it('Should not create new Workflow app, when workspace level limit for workflow app creation is reached', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      const createAppResponse = await request(app.getHttpServer())
        .post('/api/apps')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({
          icon: 'home',
          name: 'Sample workflow',
          type: 'workflow',
        });
      const { message } = createAppResponse.body;

      expect(message).toBe('Maximum workflow limit reached for the current workspace');
      expect(createAppResponse.statusCode).toBe(451);
    });
  });

  describe('Wokflow Creation: App Limit Reached at Instance level', () => {
    beforeEach(() => {
      jest.spyOn(licenseServiceMock, 'getLicenseTerms').mockImplementation((key: LICENSE_FIELD) => {
        switch (key) {
          case LICENSE_FIELD.VALID:
            return true;
          case LICENSE_FIELD.IS_EXPIRED:
            return false;
          case LICENSE_FIELD.WORKFLOWS:
            return {
              execution_timeout: 60,
              workspace: {
                total: 200,
                daily_executions: 500,
                monthly_executions: 10000,
              },
              instance: {
                total: 0,
                daily_executions: 25000,
                monthly_executions: 50000,
              },
            };
        }
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it('Should not create new Workflow app, when Instance level limit for workflow app creation is reached', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      const createAppResponse = await request(app.getHttpServer())
        .post('/api/apps')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({
          icon: 'home',
          name: 'Sample workflow',
          type: 'workflow',
        });
      const { message } = createAppResponse.body;

      expect(message).toBe('Maximum workflow limit reached');
      expect(createAppResponse.statusCode).toBe(451);
    });
  });

  describe('Wokflow Execution: Daily Execution Limit Reached at Workspace level', () => {
    beforeEach(() => {
      jest.spyOn(licenseServiceMock, 'getLicenseTerms').mockImplementation((key: LICENSE_FIELD) => {
        switch (key) {
          case LICENSE_FIELD.VALID:
            return true;
          case LICENSE_FIELD.IS_EXPIRED:
            return false;
          case LICENSE_FIELD.WORKFLOWS:
            return {
              execution_timeout: 60,
              workspace: {
                total: 200,
                daily_executions: 0,
                monthly_executions: 10000,
              },
              instance: {
                total: 1000,
                daily_executions: 25000,
                monthly_executions: 50000,
              },
            };
        }
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it('Should not be able to Run Workflows - When Daily execution limit at Workspace level is reached', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
      const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(false);
      await createApplicationVersion(app, workflow, sampleWorkflowDefinition);

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      // Enabling workflow
      const enableWorkflowStatusResponse = await enableWorkflowStatus(
        app,
        workflow?.id,
        user.defaultOrganizationId,
        userData['tokenCookie'],
        true
      );

      expect(enableWorkflowStatusResponse.statusCode).toBe(200);

      const response = await request(app.getHttpServer())
        .post('/api/workflow_executions')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({ appId: workflow.id, executeUsing: 'app', userId: user.id });
      const { message } = response.body;

      expect(message).toBe('Maximum daily limit for workflow execution has reached for this workspace');
      expect(response.statusCode).toBe(451);
    });
  });

  describe('Wokflow Execution: Daily Execution Limit Reached at Instance level', () => {
    beforeEach(() => {
      jest.spyOn(licenseServiceMock, 'getLicenseTerms').mockImplementation((key: LICENSE_FIELD) => {
        switch (key) {
          case LICENSE_FIELD.VALID:
            return true;
          case LICENSE_FIELD.IS_EXPIRED:
            return false;
          case LICENSE_FIELD.WORKFLOWS:
            return {
              execution_timeout: 60,
              workspace: {
                total: 200,
                daily_executions: 500,
                monthly_executions: 10000,
              },
              instance: {
                total: 1000,
                daily_executions: 0,
                monthly_executions: 50000,
              },
            };
        }
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it('Should not be able to Run Workflows - When Daily execution limit at Instance level is reached', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
      const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(false);
      await createApplicationVersion(app, workflow, sampleWorkflowDefinition);

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      // Enabling workflow
      const enableWorkflowStatusResponse = await enableWorkflowStatus(
        app,
        workflow?.id,
        user.defaultOrganizationId,
        userData['tokenCookie'],
        true
      );

      expect(enableWorkflowStatusResponse.statusCode).toBe(200);

      const response = await request(app.getHttpServer())
        .post('/api/workflow_executions')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({ appId: workflow.id, executeUsing: 'app', userId: user.id });
      const { message } = response.body;

      expect(message).toBe('Maximum daily limit for workflow execution has been reached');
      expect(response.statusCode).toBe(451);
    });
  });

  describe('Wokflow Execution: Monthly Execution Limit Reached at Workspace level', () => {
    beforeEach(() => {
      jest.spyOn(licenseServiceMock, 'getLicenseTerms').mockImplementation((key: LICENSE_FIELD) => {
        switch (key) {
          case LICENSE_FIELD.VALID:
            return true;
          case LICENSE_FIELD.IS_EXPIRED:
            return false;
          case LICENSE_FIELD.WORKFLOWS:
            return {
              execution_timeout: 60,
              workspace: {
                total: 200,
                daily_executions: 500,
                monthly_executions: 0,
              },
              instance: {
                total: 1000,
                daily_executions: 25000,
                monthly_executions: 50000,
              },
            };
        }
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it('Should not be able to Run Workflows - When Monthly execution limit at Workspace level is reached', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
      const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(false);
      await createApplicationVersion(app, workflow, sampleWorkflowDefinition);

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      // Enabling workflow
      const enableWorkflowStatusResponse = await enableWorkflowStatus(
        app,
        workflow?.id,
        user.defaultOrganizationId,
        userData['tokenCookie'],
        true
      );

      expect(enableWorkflowStatusResponse.statusCode).toBe(200);

      const response = await request(app.getHttpServer())
        .post('/api/workflow_executions')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({ appId: workflow.id, executeUsing: 'app', userId: user.id });
      const { message } = response.body;

      expect(message).toBe('Maximum monthly limit for workflow execution has reached for this workspace');
      expect(response.statusCode).toBe(451);
    });
  });

  describe('Wokflow Execution: Monthly Execution Limit Reached at Instance level', () => {
    beforeEach(() => {
      jest.spyOn(licenseServiceMock, 'getLicenseTerms').mockImplementation((key: LICENSE_FIELD) => {
        switch (key) {
          case LICENSE_FIELD.VALID:
            return true;
          case LICENSE_FIELD.IS_EXPIRED:
            return false;
          case LICENSE_FIELD.WORKFLOWS:
            return {
              execution_timeout: 60,
              workspace: {
                total: 200,
                daily_executions: 500,
                monthly_executions: 10000,
              },
              instance: {
                total: 1000,
                daily_executions: 25000,
                monthly_executions: 0,
              },
            };
        }
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it('Should not be able to Run Workflows - When Monthly execution limit at Instance level is reached', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
      const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(false);
      await createApplicationVersion(app, workflow, sampleWorkflowDefinition);

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      // Enabling workflow
      const enableWorkflowStatusResponse = await enableWorkflowStatus(
        app,
        workflow?.id,
        user.defaultOrganizationId,
        userData['tokenCookie'],
        true
      );

      expect(enableWorkflowStatusResponse.statusCode).toBe(200);

      const response = await request(app.getHttpServer())
        .post('/api/workflow_executions')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({ appId: workflow.id, executeUsing: 'app', userId: user.id });
      const { message } = response.body;

      expect(message).toBe('Maximum monthly limit for workflow execution has been reached');
      expect(response.statusCode).toBe(451);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
