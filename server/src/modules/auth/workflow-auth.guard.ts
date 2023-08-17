import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { maybeSetSubPath } from 'src/helpers/utils.helper';
import { App } from 'src/entities/app.entity';
import { getManager } from 'typeorm';

@Injectable()
export class WorkflowAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();

    // unauthenticated users should be able to to run workflows of public apps

    const apiUrl = maybeSetSubPath('/api/workflow_executions');
    if (request.method === 'POST' && request.route.path === apiUrl) {
      const frontEndAppId = request.body?.executeUsing === 'app' && request.body?.app;

      const app = await getManager().findOne(App, {
        where: {
          id: frontEndAppId,
        },
      });

      request.tj_app = app;
      request.headers['tj-workspace-id'] = app.organizationId;

      if (app.isPublic === true) {
        return true;
      }
    }

    return super.canActivate(context);
  }
}
