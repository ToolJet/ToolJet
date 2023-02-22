import { ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Organization } from 'src/entities/organization.entity';
import { getManager } from 'typeorm';

@Injectable()
export class AuthrizeWorkspaceGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    request.isOrganizationLogin = true;
    let user;
    if (request.headers['authorization']) {
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
        user = await super.canActivate(context);
      } catch (err) {
        return false;
      }
      return user;
    }
  }
}
