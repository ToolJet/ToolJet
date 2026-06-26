import {
  ExecutionContext,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
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

    // When the requesting workspace is known, try a workspace-scoped +
    // branch-aware lookup first. Feature-branch slugs can be shared across
    // orgs that pulled from the same git source, so a cross-workspace lookup
    // (findAppBySlug) would non-deterministically return whichever org's row
    // was updated most recently. The org-scoped path resolves correctly.
    const workspaceId = request.headers['tj-workspace-id'] as string;
    const branchId = request.headers['x-branch-id'] as string;

    let app = workspaceId
      ? await this.appRepository.findBySlug(slug, workspaceId, undefined, branchId)
      : null;

    if (!app && !workspaceId) {
      app = await this.appRepository.findAppBySlug(slug);
    }
    if (!app) {
      app = await this.appRepository.findByAppId(slug);
    }

    if (!app) throw new NotFoundException('App not found. Invalid app id');

    const organization = await this.organizationRepository.findOne({ where: { id: app.organizationId } });
    if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE) {
      throw new BadRequestException('Organization is Archived');
    }

    request.tj_app = app;
    request.tj_resource_id = app.id;
    // Set workspace header before JWT validation so the JWT strategy picks up the correct org
    request.headers['tj-workspace-id'] = app.organizationId;

    try {
      const authResult = await super.canActivate(context);
      return authResult;
    } catch {
      throw new UnauthorizedException(
        JSON.stringify({
          message: 'Authentication is required to access this app.',
        })
      );
    }
  }
}
