import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DataQueriesService } from '@services/data_queries.service';

@Injectable()
export class QueryAuthGuard extends AuthGuard('jwt') {
  constructor(private dataQueriesService: DataQueriesService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();

    // unauthenticated users should be able to to run queries of public apps
    if (request.route.path === '/api/data_queries/:id/run') {
      const dataQuery = await this.dataQueriesService.findOne(request.params.id);
      const app = dataQuery.app;

      if (app.isPublic === true) {
        return true;
      }
    }

    return super.canActivate(context);
  }
}
