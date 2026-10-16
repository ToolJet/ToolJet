import 'reflect-metadata';
import { CallHandler, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA, VERSION_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { firstValueFrom, of } from 'rxjs';
import { PatScopeInterceptor } from '@modules/personal-access-tokens/interceptors/pat-scope.interceptor';
import { WorkflowsController } from '@modules/workflows/controllers/workflows.controller';
import { WorkflowExecutionsController } from '@modules/workflows/controllers/workflow-executions.controller';
import { WorkflowSchedulesController } from '@modules/workflows/controllers/workflow-schedules.controller';
import { WorkflowWebhooksController } from '@modules/workflows/controllers/workflow-webhooks.controller';

// Exercise the real public controller metadata through the scope interceptor. These are
// authorization unit tests, not HTTP/engine tests: guards, queues, and webhook auth are not run.
const routes = [
  {
    controller: WorkflowsController,
    handler: WorkflowsController.prototype.create,
    method: RequestMethod.POST,
    label: 'POST',
    url: '/api/workflows',
  },
  {
    controller: WorkflowExecutionsController,
    handler: WorkflowExecutionsController.prototype.create,
    method: RequestMethod.POST,
    label: 'POST',
    url: '/api/workflow_executions',
  },
  {
    controller: WorkflowExecutionsController,
    handler: WorkflowExecutionsController.prototype.status,
    method: RequestMethod.GET,
    label: 'GET',
    url: '/api/workflow_executions/:id/status',
  },
  {
    controller: WorkflowExecutionsController,
    handler: WorkflowExecutionsController.prototype.show,
    method: RequestMethod.GET,
    label: 'GET',
    url: '/api/workflow_executions/:id',
  },
  {
    controller: WorkflowExecutionsController,
    handler: WorkflowExecutionsController.prototype.index,
    method: RequestMethod.GET,
    label: 'GET',
    url: '/api/workflow_executions/all/:appVersionId',
  },
  {
    controller: WorkflowExecutionsController,
    handler: WorkflowExecutionsController.prototype.getExecutions,
    method: RequestMethod.GET,
    label: 'GET',
    url: '/api/workflow_executions',
  },
  {
    controller: WorkflowExecutionsController,
    handler: WorkflowExecutionsController.prototype.getExecutionNodes,
    method: RequestMethod.GET,
    label: 'GET',
    url: '/api/workflow_executions/:id/nodes',
  },
  {
    controller: WorkflowExecutionsController,
    handler: WorkflowExecutionsController.prototype.previewQueryNode,
    method: RequestMethod.POST,
    label: 'POST',
    url: '/api/workflow_executions/previewQueryNode',
  },
  {
    controller: WorkflowExecutionsController,
    handler: WorkflowExecutionsController.prototype.trigger,
    method: RequestMethod.POST,
    label: 'POST',
    url: '/api/workflow_executions/:id/trigger',
  },
  {
    controller: WorkflowExecutionsController,
    handler: WorkflowExecutionsController.prototype.streamWorkflowExecution,
    method: RequestMethod.GET,
    label: 'GET (SSE)',
    url: '/api/workflow_executions/:id/stream',
  },
  {
    controller: WorkflowSchedulesController,
    handler: WorkflowSchedulesController.prototype.create,
    method: RequestMethod.POST,
    label: 'POST',
    url: '/api/workflow-schedules',
  },
  {
    controller: WorkflowSchedulesController,
    handler: WorkflowSchedulesController.prototype.findAll,
    method: RequestMethod.GET,
    label: 'GET',
    url: '/api/workflow-schedules',
  },
  {
    controller: WorkflowSchedulesController,
    handler: WorkflowSchedulesController.prototype.findOne,
    method: RequestMethod.GET,
    label: 'GET',
    url: '/api/workflow-schedules/:id',
  },
  {
    controller: WorkflowSchedulesController,
    handler: WorkflowSchedulesController.prototype.update,
    method: RequestMethod.PUT,
    label: 'PUT',
    url: '/api/workflow-schedules/:id',
  },
  {
    controller: WorkflowSchedulesController,
    handler: WorkflowSchedulesController.prototype.activate,
    method: RequestMethod.PUT,
    label: 'PUT',
    url: '/api/workflow-schedules/activate/:id',
  },
  {
    controller: WorkflowSchedulesController,
    handler: WorkflowSchedulesController.prototype.remove,
    method: RequestMethod.DELETE,
    label: 'DELETE',
    url: '/api/workflow-schedules/:id',
  },
  {
    controller: WorkflowWebhooksController,
    handler: WorkflowWebhooksController.prototype.triggerWorkflow,
    method: RequestMethod.POST,
    label: 'POST',
    url: '/api/v2/webhooks/workflows/:id/trigger',
  },
  {
    controller: WorkflowWebhooksController,
    handler: WorkflowWebhooksController.prototype.triggerWorkflowAsync,
    method: RequestMethod.POST,
    label: 'POST',
    url: '/api/v2/webhooks/workflows/:idOrName/trigger-async',
  },
  {
    controller: WorkflowWebhooksController,
    handler: WorkflowWebhooksController.prototype.getExecutionStatus,
    method: RequestMethod.GET,
    label: 'GET',
    url: '/api/v2/webhooks/workflows/:idOrName/status/:executionId',
  },
  {
    controller: WorkflowWebhooksController,
    handler: WorkflowWebhooksController.prototype.triggerWorkflowStream,
    method: RequestMethod.GET,
    label: 'GET (SSE)',
    url: '/api/v2/webhooks/workflows/:idOrName/execution/:executionId/stream',
  },
  {
    controller: WorkflowWebhooksController,
    handler: WorkflowWebhooksController.prototype.updateWorkflow,
    method: RequestMethod.PATCH,
    label: 'PATCH',
    url: '/api/v2/webhooks/workflows/:id',
  },
];

/** @group security */
describe('Workflow route PAT scopes', () => {
  const reflector = new Reflector();
  const interceptor = new PatScopeInterceptor(reflector);

  it.each(routes)('$label $url permits a workspace PAT through the scope interceptor', async (route) => {
    // Pin the URL to the actual decorated method, so a renamed/moved route cannot leave a
    // misleading green case behind. This also exercises per-handler feature metadata.
    const version = reflector.get<string>(VERSION_METADATA, route.controller);
    const prefix = reflector.get<string>(PATH_METADATA, route.controller);
    const path = reflector.get<string>(PATH_METADATA, route.handler);
    const url = ['/api', version ? `v${version}` : '', prefix, path === '/' ? '' : path].filter(Boolean).join('/');
    expect(url).toBe(route.url);
    expect(reflector.get<RequestMethod>(METHOD_METADATA, route.handler)).toBe(route.method);

    const context = new ExecutionContextHost(
      [{ user: { isPATLogin: true, organizationId: 'workspace-id' } }],
      route.controller,
      route.handler
    );
    context.setType('http');
    const next: CallHandler = { handle: jest.fn(() => of({ reachedHandler: true })) };

    await expect(firstValueFrom(interceptor.intercept(context, next))).resolves.toEqual({ reachedHandler: true });
    expect(next.handle).toHaveBeenCalledTimes(1);
  });
});
