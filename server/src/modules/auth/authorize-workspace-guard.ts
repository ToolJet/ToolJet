import { ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Organization } from 'src/entities/organization.entity';
import { getManager } from 'typeorm';

@Injectable()
export class AuthorizeWorkspaceGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    if (request?.cookies['tj_auth_token']) {
      let user: any;
      let workspaceName = request?.query['workspace_name'];
      if (workspaceName) {
        workspaceName = workspaceName.replace('-', ' ');
        const org = await getManager().findOne(Organization, {
          where: { name: workspaceName },
          select: ['id'],
        });
        if (!org) {
          throw new NotFoundException();
        }
        request.headers['tj-workspace-id'] = org?.id;
      }

      try {
        user = super.canActivate(context);
      } catch (err) {
        return false;
      }
      return user;
    }
  }
}
