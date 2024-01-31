import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  clearDB,
  createUser,
  createNestAppInstance,
  authenticateUser,
  createApplication,
  createApplicationVersion,
} from '../test.helper';

describe('workflow executions controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('POST /api/workflow_executions', () => {
    it('should allow users to create new workflow execution', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow', user, type: 'workflow' });
      await createApplicationVersion(app, workflow, {
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

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .post('/api/workflow_executions')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({ appId: workflow.id, executeUsing: 'app', userId: user.id });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('GET /api/workflow_executions/:id/status', () => {
    it('should allow users to check status of workflow execution', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow', user, type: 'workflow' });
      await createApplicationVersion(app, workflow, {
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

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .post('/api/workflow_executions')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({ appId: workflow.id, executeUsing: 'app', userId: user.id });

      expect(response.statusCode).toBe(201);

      const statusResponse = await request(app.getHttpServer())
        .get(`/api/workflow_executions/${response.body.workflowExecution.id}/status`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send();

      expect(statusResponse.statusCode).toBe(200);
    });
  });

  describe('GET /api/workflow_executions/:id', () => {
    it('should allow users to retrieve execution details including logs', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow', user, type: 'workflow' });
      await createApplicationVersion(app, workflow, {
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

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await request(app.getHttpServer())
        .post('/api/workflow_executions')
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({ appId: workflow.id, executeUsing: 'app', userId: user.id });

      expect(response.statusCode).toBe(201);

      const workflowResponse = await request(app.getHttpServer())
        .get(`/api/workflow_executions/${response.body.workflowExecution.id}`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send();

      expect(workflowResponse.statusCode).toBe(200);
      expect(workflowResponse.body).toHaveProperty('logs');
    });
  });

  describe('GET /api/workflow_executions/all/:appVersionId', () => {
    it('should allow users to list all the executions of a given app version id', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'workflow', user, type: 'workflow' });
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

      const loggedUser = await authenticateUser(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

      for (let i = 0; i < 2; i++) {
        await request(app.getHttpServer())
          .post('/api/workflow_executions')
          .set('tj-workspace-id', user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie'])
          .send({ appId: workflow.id, executeUsing: 'app', userId: user.id });
      }

      const response = await request(app.getHttpServer())
        .get(`/api/workflow_executions/all/${appVersion.id}`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send();

      expect(response.body.length).toBe(2);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
