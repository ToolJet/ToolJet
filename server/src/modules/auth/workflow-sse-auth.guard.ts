import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// SSE stream auth: EventSource sends the cookie but can't set headers, so the active workspace
// rides as a query param that we promote to tj-workspace-id before authenticating (login mandatory).
// FeatureAbilityGuard on the route enforces workspace ownership of the run.
@Injectable()
export class WorkflowSseAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (!request.headers['tj-workspace-id']) {
      const workspaceId = request.query?.['tj-workspace-id'];
      if (typeof workspaceId === 'string' && workspaceId) {
        request.headers['tj-workspace-id'] = workspaceId;
      }
    }

    return super.canActivate(context);
  }
}
