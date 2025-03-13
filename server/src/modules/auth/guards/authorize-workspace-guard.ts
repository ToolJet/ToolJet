import { ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Organization } from 'src/entities/organization.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager } from 'typeorm';

@Injectable()
export class AuthorizeWorkspaceGuard extends AuthGuard('jwt') {
  constructor(protected readonly manager: EntityManager) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    if (request?.cookies['tj_auth_token']) {
      let user: any;
      const organizationId =
        typeof request.headers['tj-workspace-id'] === 'object'
          ? request.headers['tj-workspace-id'][0]
          : request.headers['tj-workspace-id'];

      if (organizationId) {
        await dbTransactionWrap(async (manager: EntityManager) => {
          const org = await manager.findOne(Organization, {
            where: { id: organizationId },
            select: ['id'],
          });
          if (!org) {
            throw new NotFoundException();
          }
        }, this.manager);
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
