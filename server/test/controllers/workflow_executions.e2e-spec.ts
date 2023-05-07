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

  afterAll(async () => {
    await app.close();
  });
});
