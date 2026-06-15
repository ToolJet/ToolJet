import {
  ExecutionContext,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';
import { AppsUtilService } from '../util.service';
import { AppsRepository } from '../repository';
import { OrganizationRepository } from '@modules/organizations/repository';

@Injectable()
export class PrivateAppAuthGuard extends AuthGuard('jwt') {
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

    const app = await this.appRepository.findOne({ where: { slug } });
    if (!app) throw new NotFoundException('App not found. Invalid app id');

    const organization = await this.organizationRepository.findOne({ where: { id: app.organizationId } });
    if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE) {
      throw new BadRequestException('Organization is Archived');
    }

    // If the request already carries a workspace id (user is logged into a workspace),
    // check it matches the app's workspace. A mismatch means the user needs to switch.
    const incomingWorkspaceId: string | undefined = request.headers['tj-workspace-id'];
    if (incomingWorkspaceId && incomingWorkspaceId !== app.organizationId) {
      throw new ForbiddenException(
        JSON.stringify({
          organizationId: organization?.slug || organization?.id,
          message: 'App belongs to a different workspace.',
        })
      );
    }

    request.tj_app = app;
    request.tj_resource_id = app.id;
    // Set workspace header before JWT validation so the JWT strategy picks up the correct org
    request.headers['tj-workspace-id'] = app.organizationId;

    try {
      const authResult = await super.canActivate(context);
      return authResult;
    } catch {
      let organizationSlug: string | undefined;
      if (app?.organizationId) {
        const org = await this.appUtilService.getAppOrganizationDetails(app);
        organizationSlug = org.slug || org.id;
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
