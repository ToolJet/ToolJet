import { INestApplication } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { WorkflowApprovalRequest } from '@entities/workflow_approval_request.entity';
import { WorkflowExecution } from '@entities/workflow_execution.entity';
import { WorkflowExecutionNode } from '@entities/workflow_execution_node.entity';
import {
  initTestApp,
  closeTestApp,
  saveEntity,
  findEntity,
  deleteEntities,
  setupOrganizationAndUser,
  createWorkflowForUser,
  createWorkflowApplicationVersion,
} from 'test-helper';

/** @group workflows */
describe('approval request cascade on app delete', () => {
  let app: INestApplication;
  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('deletes pending approval requests when the workflow app is deleted', async () => {
    const { user } = await setupOrganizationAndUser(app, {
      email: 'hitl-cascade@tooljet.io',
      password: 'password',
      firstName: 'H',
      lastName: 'C',
    });
    const workflowApp = await createWorkflowForUser(app, user, 'HITL cascade wf');
    const appVersion = await createWorkflowApplicationVersion(app, workflowApp);
    const execution = await saveEntity(WorkflowExecution, {
      appVersionId: appVersion.id,
      startNodeId: null,
      executed: false,
      status: 'waiting',
      executingUserId: user.id,
      logs: [],
    });
    const node = await saveEntity(WorkflowExecutionNode, {
      type: 'human',
      executed: false,
      result: '',
      state: {},
      idOnWorkflowDefinition: 'human1',
      workflowExecutionId: execution.id,
      definition: { nodeType: 'human' },
    });
    const req = await saveEntity(WorkflowApprovalRequest, {
      workflowExecutionId: execution.id,
      executionNodeId: node.id,
      token: `tok-cascade-${Date.now()}`,
      status: 'pending',
      approversSnapshot: {},
      expiresAt: null,
    });

    // Delete the app (cascades: app -> app_versions -> workflow_executions -> workflow_approval_requests)
    await deleteEntities(App, { id: workflowApp.id });

    expect(await findEntity(WorkflowApprovalRequest, { id: req.id })).toBeNull();
  });
});
