import { ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

    // ✅ Allow execution only if one of the expected auth methods is present
    const hasJwtCookie = !!request.cookies['tj_auth_token'];
    const hasPatHeader = !!request.headers['tj_auth_token'];

    if (!hasJwtCookie && !hasPatHeader) {
      throw new UnauthorizedException('Missing authentication token');
    }

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      return false;
    }
    return user;
  }
}
