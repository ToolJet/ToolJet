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
      const organizationId =
        typeof request.headers['tj-workspace-id'] === 'object'
          ? request.headers['tj-workspace-id'][0]
          : request.headers['tj-workspace-id'];
      if (organizationId) {
        const org = await getManager().findOne(Organization, {
          where: { id: organizationId },
          select: ['id'],
        });
        if (!org) {
          throw new NotFoundException();
        }
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
