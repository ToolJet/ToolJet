import {
  ExecutionContext,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createHash } from 'crypto';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';
import { AppsUtilService } from '../util.service';
import { AppsRepository } from '../repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { trackPublicAppViewer } from '@otel/tracing';
@Injectable()
export class AppAuthGuard extends AuthGuard('jwt') {
  // This guard will allow access for unauthenticated user if the app is public
  constructor(
    protected readonly appUtilService: AppsUtilService,
    protected readonly organizationRepository: OrganizationRepository,
    protected readonly appRepository: AppsRepository
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();

    const slug = request.params.slug || request.params.app_slug;
    if (!slug) {
      throw new NotFoundException('App not found. Invalid app id');
    }

    // unauthenticated users should be able to to view public apps
    const app = await this.appRepository.findOne({
      where: {
        slug,
      },
    });
    if (!app) throw new NotFoundException('App not found. Invalid app id');
    const organization = await this.organizationRepository.findOne({
      where: {
        id: app.organizationId,
      },
    });
    if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE)
      throw new BadRequestException('Organization is Archived');

    request.tj_app = app;
    request.tj_resource_id = app.id;
    request.headers['tj-workspace-id'] = app.organizationId;

    if (app.isPublic === true) {
      // Track anonymous public app viewers: synthetic hashed ID (IP + UA) per app + workspace.
      try {
        const ip = request.ip || '';
        const ua = (request.headers['user-agent'] || '').slice(0, 64);
        const viewerId = 'anon_' + createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 16);
        trackPublicAppViewer({
          workspaceId: app.organizationId,
          workspaceName: organization?.name || '',
          appId: app.id,
          appName: app.name,
          viewerId,
        });
      } catch {
        // Never block the request due to metrics tracking failure
      }
      return true;
    }

    // Fall back to JWT authentication
    try {
      const authResult = await super.canActivate(context);
      return authResult;
    } catch {
      let organizationSlug: string;
      if (app?.organizationId) {
        const organization = await this.appUtilService.getAppOrganizationDetails(app);
        organizationSlug = organization.slug || organization.id;
      }

      throw new UnauthorizedException(
        JSON.stringify({
          organizationId: organizationSlug,
          message: 'Authentication is required to access this app.',
        })
      );
    }
  }
}
