import {
  ExecutionContext,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { App } from 'src/entities/app.entity';
import { Organization } from 'src/entities/organization.entity';
import { getManager } from 'typeorm';
import { WORKSPACE_STATUS } from 'src/helpers/user_lifecycle';

@Injectable()
export class AppAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();

    const slug = request.params.slug;
    if (!slug) {
      throw new NotFoundException('App not found. Invalid app id');
    }

    // unauthenticated users should be able to to view public apps
    const app = await getManager().findOne(App, {
      where: {
        slug,
      },
    });
    if (!app) throw new NotFoundException('App not found. Invalid app id');
    const organization = await getManager().findOne(Organization, {
      where: {
        id: app.organizationId,
      },
    });
    if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE)
      throw new BadRequestException('Organization is Archived');

    request.tj_app = app;
    request.headers['tj-workspace-id'] = app.organizationId;

    if (app.isPublic === true) {
      return true;
    }

    // Throw a custom exception with workspace ID if the app is not public
    try {
      const authResult = await super.canActivate(context);
      return authResult;
    } catch (error) {
      throw new UnauthorizedException(
        JSON.stringify({
          organizationId: app?.organizationId,
          message: 'Authentication is required to access this app.',
        })
      );
    }
  }
}
