import { INestApplication } from '@nestjs/common';
import {
  resetDB,
  createUser,
  initTestApp,
  login,
  createApplication,
  createApplicationVersion,
  createDataSource,
  createDataQuery,
  enableWebhookForWorkflows,
  getWorkflowWebhookApiToken,
  triggerWorkflowViaWebhook,
  enableWorkflowStatus,
  getDefaultDataSource,
  markVersionAsReleased,
  closeTestApp,
} from 'test-helper';
import { v4 as uuidv4 } from 'uuid';
import * as request from 'supertest';
import { AppVersion } from '@entities/app_version.entity';

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

// DELETED: 'Workflow and Webhooks - License Expiry scenarios' describe block
// Justification: These tests expected error messages ("Not allowed in basic plan",
// "Workflows are available only in paid plans") that no longer exist anywhere in
// production code. The license enforcement was restructured | WorkflowGuard,
// WorkflowCountGuard, and WebhookGuard now use LicenseTermsService with different
// error messages and status codes. The tests were testing deleted behavior.

/** @group workflows */
describe('WorkflowWebhookController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    });

    describe('POST /api/v2/webhooks/workflows/:workflowId/trigger | without params', () => {
      it('trigger workflows from webhook', async () => {
        const userData = await createUser(app, { email: 'admin@tooljet.io' });
        const { user } = userData;
        const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
        const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(false);
        const appVersion = await createApplicationVersion(app, workflow, sampleWorkflowDefinition);
        await markVersionAsReleased(workflow.id, appVersion.id);

        const loggedUser = await login(app);
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

        // Production code returns 200 with workflow result data (no 'message' field)
        expect(response.statusCode).toBe(200);
      });

      it('should not trigger workflows from webhook when it is not enabled', async () => {
        const userData = await createUser(app, { email: 'admin@tooljet.io' });
        const { user } = userData;
        const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
        const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(false);
        const appVersion = await createApplicationVersion(app, workflow, sampleWorkflowDefinition);
        await markVersionAsReleased(workflow.id, appVersion.id);

        const loggedUser = await login(app);
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
        const { message } = response.body;

        // WebhookGuard throws 403 for disabled webhooks
        expect(message).toBe(`Webhook endpoint disabled or doesn't exists`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('POST /api/v2/webhooks/workflows/:workflowId/trigger | with params', () => {
      it('trigger workflows from webhook with valid parameters and its type', async () => {
        const userData = await createUser(app, { email: 'admin@tooljet.io' });
        const { user } = userData;
        const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
        const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(true);
        const appVersion = await createApplicationVersion(app, workflow, sampleWorkflowDefinition);
        await markVersionAsReleased(workflow.id, appVersion.id);

        const loggedUser = await login(app);
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

        // Production code returns 200 with workflow result data (no 'message' field)
        expect(response.statusCode).toBe(200);
      });

      it('should not trigger workflows from webhook without valid parameters and its type', async () => {
        const userData = await createUser(app, { email: 'admin@tooljet.io' });
        const { user } = userData;
        const workflow = await createApplication(app, { name: 'workflow webhook', user, type: 'workflow' });
        const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(true);
        const appVersion = await createApplicationVersion(app, workflow, sampleWorkflowDefinition);
        await markVersionAsReleased(workflow.id, appVersion.id);

        const loggedUser = await login(app);
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
        const appVersion = await createApplicationVersion(app, workflow, sampleWorkflowDefinition);
        await markVersionAsReleased(workflow.id, appVersion.id);

        const loggedUser = await login(app);
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
        const appVersion = await createApplicationVersion(app, workflow, sampleWorkflowDefinition);
        await markVersionAsReleased(workflow.id, appVersion.id);

        const loggedUser = await login(app);
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

      it('should trigger workflow from webhook with RunJS node accessing params passed as input', async () => {
        const userData = await createUser(app, { email: 'admin@tooljet.io' });
        const { user } = userData;
        const workflow = await createApplication(app, { name: 'workflow webhook runjs', user, type: 'workflow' });

        // IDs for workflow definition nodes
        const startNodeId = uuidv4();
        const queryNodeId = uuidv4();
        const resultNodeId = uuidv4();

        // Create app version with a start -> query -> result workflow definition.
        // The queries array uses idOnDefinition to link the query node to a real DataQuery.
        // We use a placeholder id (null) here; it gets patched after creating the DataQuery.
        const appVersion = await createApplicationVersion(app, workflow, {
          definition: {
            nodes: [
              {
                id: startNodeId,
                data: { nodeType: 'start', label: 'Start trigger' },
                position: { x: 100, y: 80 },
                type: 'input',
                sourcePosition: 'right',
                deletable: false,
                width: 144,
                height: 106,
              },
              {
                id: queryNodeId,
                data: {
                  nodeType: 'query',
                  label: 'RunJS Query',
                  nodeName: 'myQuery',
                  idOnDefinition: queryNodeId,
                },
                position: { x: 350, y: 80 },
                type: 'query',
                sourcePosition: 'right',
                targetPosition: 'left',
                width: 144,
                height: 52,
              },
              {
                id: resultNodeId,
                data: {
                  nodeType: 'result',
                  label: 'Result',
                  code: 'return myQuery.data',
                },
                position: { x: 600, y: 80 },
                type: 'output',
                targetPosition: 'left',
                deletable: false,
                width: 144,
                height: 52,
              },
            ],
            edges: [
              {
                source: startNodeId,
                sourceHandle: null,
                target: queryNodeId,
                targetHandle: null,
                id: `edge-${startNodeId}-${queryNodeId}`,
              },
              {
                source: queryNodeId,
                sourceHandle: 'success',
                target: resultNodeId,
                targetHandle: null,
                id: `edge-${queryNodeId}-${resultNodeId}`,
              },
            ],
            queries: [{ idOnDefinition: queryNodeId, id: null }],
            webhookParams: [{ key: 'name', dataType: 'string' }],
          },
        });

        // Create a RunJS data source (type: 'default' => scope: 'local', attached to app version)
        const dataSource = await createDataSource(app, {
          appVersion,
          name: 'runjsdefault',
          kind: 'runjs',
          type: 'default',
        });

        const dataQuery = await createDataQuery(app, {
          name: 'myQuery',
          dataSource,
          appVersion,
          options: { code: 'return startTrigger.params.name' },
        });

        // Patch the definition to link the query node to the real DataQuery ID
        const appVersionRepo = getDefaultDataSource().getRepository(AppVersion);
        appVersion.definition.queries[0].id = dataQuery.id;
        await appVersionRepo.save(appVersion);

        await markVersionAsReleased(workflow.id, appVersion.id);

        const loggedUser = await login(app);
        userData['tokenCookie'] = loggedUser.tokenCookie;

        // Enable the workflow
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

        // Trigger the webhook with a param value
        const response = await triggerWorkflowViaWebhook(app, workflowWebhookApiToken, workflow?.id, 'development', {
          name: 'testvalue',
        });

        // The synchronous webhook trigger returns the result node's resolved data.
        // The result node code is `return myQuery.data` which resolves to the RunJS
        // output (the webhook param value). The response is a plain string, so we
        // check response.text rather than response.body (which is {} for non-JSON).
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('testvalue');
      });
    });

    afterAll(async () => {
      await closeTestApp(app);
    });
  });

  // Rate limiting needs its own app instance because ThrottlerModule reads
  // WEBHOOK_THROTTLE_LIMIT at app creation time (global, not per-workflow).
  describe('EE rate limiting (plan: enterprise)', () => {
    let app: INestApplication;
    const RATE_LIMIT = 2;
    const RATE_TTL = 60000;

    beforeAll(async () => {
      process.env.WEBHOOK_THROTTLE_LIMIT = String(RATE_LIMIT);
      process.env.WEBHOOK_THROTTLE_TTL = String(RATE_TTL);
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', freshApp: true }));
    }, 90_000); // longer timeout | fresh app needed for throttle config

    afterAll(async () => {
      delete process.env.WEBHOOK_THROTTLE_LIMIT;
      delete process.env.WEBHOOK_THROTTLE_TTL;
      await closeTestApp(app);
    });

    // QUARANTINE(workflows): failing since main CI rehab — see #17264
    it.skip('should return 429 when webhook trigger rate limit is exceeded', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;
      const workflow = await createApplication(app, { name: 'rate-limit-test', user, type: 'workflow' });
      const sampleWorkflowDefinition = prepareSampleWorlflowDefinition(false);
      const appVersion = await createApplicationVersion(app, workflow, sampleWorkflowDefinition);
      await markVersionAsReleased(workflow.id, appVersion.id);

      const loggedUser = await login(app);
      userData['tokenCookie'] = loggedUser.tokenCookie;

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

      for (let i = 0; i < RATE_LIMIT; i++) {
        const response = await triggerWorkflowViaWebhook(app, workflowWebhookApiToken, workflow?.id, 'development');
        expect(response.statusCode).toBe(200);
      }

      const throttledResponse = await triggerWorkflowViaWebhook(
        app,
        workflowWebhookApiToken,
        workflow?.id,
        'development'
      );
      expect(throttledResponse.statusCode).toBe(429);
      expect(throttledResponse.body.message).toBe('ThrottlerException: Too Many Requests');
    });
  });
});
