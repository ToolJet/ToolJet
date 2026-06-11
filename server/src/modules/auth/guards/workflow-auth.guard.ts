import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { maybeSetSubPath } from 'src/helpers/utils.helper';
import { AppsRepository } from '@modules/apps/repository';

@Injectable()
export class WorkflowAuthGuard extends AuthGuard('jwt') {
  constructor(protected readonly appsRepository: AppsRepository) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();

    // unauthenticated users should be able to to run workflows of public apps

    const apiUrl = maybeSetSubPath('/api/workflow_executions');
    if (request.method === 'POST' && request.route.path === apiUrl) {
      const frontEndAppId = request.body?.executeUsing === 'app' && request.body?.app;

      // findOneById applies the branch-aware metadata overlay for non-workflows via
      // resolveMetadataVersion, so app.isPublic is canonical regardless of app type.
      const app = await this.appsRepository.findOneById(frontEndAppId);

      request.tj_app = app;
      request.headers['tj-workspace-id'] = app.organizationId;

      if (app.isPublic === true) {
        return true;
      }
    }

    return super.canActivate(context);
  }
}
