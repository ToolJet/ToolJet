import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  clearDB,
  setupOrganizationAndUser,
  createNestAppInstance,
  authenticateUser,
  createWorkflowForUser,
  createApplicationVersion,
} from '../workflows.helper';

/**
 * @group workflows
 */
describe('workflow executions controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB(app);
  });

  beforeAll(async () => {
    app = await createNestAppInstance({ edition: 'ee' });
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('POST /api/workflow_executions', () => {
    it('should allow users to create new workflow execution', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User'
      });
      const workflow = await createWorkflowForUser(app, user, 'workflow');
      const appVersion = await createApplicationVersion(app, workflow, {
        definition: {
          nodes: [
            {
              id: '2343243242',
              data: { nodeType: 'start', label: 'Start trigger' },
              position: { x: 100, y: 250 },
              type: 'input',
              sourcePosition: 'right',
            },
          ],
          edges: [],
        },
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .post('/api/workflow_executions')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ appId: workflow.id, executeUsing: 'app', userId: user.id, environmentId: appVersion.currentEnvironmentId });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('GET /api/workflow_executions/:id/status', () => {
    it('should allow users to check status of workflow execution', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User'
      });
      const workflow = await createWorkflowForUser(app, user, 'workflow');
      const appVersion = await createApplicationVersion(app, workflow, {
        definition: {
          nodes: [
            {
              id: '2343243242',
              data: { nodeType: 'start', label: 'Start trigger' },
              position: { x: 100, y: 250 },
              type: 'input',
              sourcePosition: 'right',
            },
          ],
          edges: [],
        },
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .post('/api/workflow_executions')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ appId: workflow.id, executeUsing: 'app', userId: user.id, environmentId: appVersion.currentEnvironmentId });

      expect(response.statusCode).toBe(201);

      const statusResponse = await request(app.getHttpServer())
        .get(`/api/workflow_executions/${response.body.workflowExecution.id}/status`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(statusResponse.statusCode).toBe(200);
    });
  });

  describe('GET /api/workflow_executions/:id', () => {
    it('should allow users to retrieve execution details including logs', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User'
      });
      const workflow = await createWorkflowForUser(app, user, 'workflow');
      const appVersion = await createApplicationVersion(app, workflow, {
        definition: {
          nodes: [
            {
              id: '2343243242',
              data: { nodeType: 'start', label: 'Start trigger' },
              position: { x: 100, y: 250 },
              type: 'input',
              sourcePosition: 'right',
            },
          ],
          edges: [],
        },
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .post('/api/workflow_executions')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send({ appId: workflow.id, executeUsing: 'app', userId: user.id, environmentId: appVersion.currentEnvironmentId });

      expect(response.statusCode).toBe(201);

      const workflowResponse = await request(app.getHttpServer())
        .get(`/api/workflow_executions/${response.body.workflowExecution.id}`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(workflowResponse.statusCode).toBe(200);
      expect(workflowResponse.body).toHaveProperty('logs');
    });
  });

  describe('GET /api/workflow_executions/all/:appVersionId', () => {
    it('should allow users to list all the executions of a given app version id', async () => {
      const { user } = await setupOrganizationAndUser(app, {
        email: 'admin@tooljet.io',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User'
      });
      const workflow = await createWorkflowForUser(app, user, 'workflow');
      const appVersion = await createApplicationVersion(app, workflow, {
        definition: {
          nodes: [
            {
              id: '2343243242',
              data: { nodeType: 'start', label: 'Start trigger' },
              position: { x: 100, y: 250 },
              type: 'input',
              sourcePosition: 'right',
            },
          ],
          edges: [],
        },
      });

      const loggedUser = await authenticateUser(app, user.email);
      const tokenCookie = loggedUser.tokenCookie;

      // Create workflow executions linked to the app version
      for (let i = 0; i < 2; i++) {
        await request(app.getHttpServer())
          .post('/api/workflow_executions')
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', tokenCookie)
          .send({
            appVersionId: appVersion.id,
            executeUsing: 'version',
            userId: user.id,
            environmentId: appVersion.currentEnvironmentId
          });
      }

      const response = await request(app.getHttpServer())
        .get(`/api/workflow_executions/all/${appVersion.id}`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', tokenCookie)
        .send();

      expect(response.body.length).toBe(2);
    });
  });

  afterAll(async () => {
    if (app) await app.close();
  });
});
