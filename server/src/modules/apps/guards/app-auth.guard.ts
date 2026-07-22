import {
  ExecutionContext,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DataSource } from 'typeorm';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';
import { WorkspaceBanList } from '@entities/workspace_ban_list.entity';
import { AppsUtilService } from '../util.service';
import { AppsRepository } from '../repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
@Injectable()
export class AppAuthGuard extends AuthGuard('jwt') {
  // This guard will allow access for unauthenticated user if the app is public
  constructor(
    protected readonly appUtilService: AppsUtilService,
    protected readonly organizationRepository: OrganizationRepository,
    protected readonly appRepository: AppsRepository,
    protected readonly dataSource: DataSource,
    protected readonly licenseTermsService: LicenseTermsService
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
    if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE) {
      const banned = await this.dataSource
        .getRepository(WorkspaceBanList)
        .findOne({ where: { organizationId: app.organizationId } });
      if (banned) {
        throw new ForbiddenException({
          message: JSON.stringify({ errorType: 'WORKSPACE_BANNED', workspaceName: organization.name }),
        });
      }
      throw new BadRequestException('Organization is Archived');
    }

    request.tj_app = app;
    request.tj_resource_id = app.id;
    request.headers['tj-workspace-id'] = app.organizationId;

    const isAppPublicLicensed =
      app.isPublic === true
        ? await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.APP_PUBLIC, app.organizationId)
        : false;

    if (app.isPublic === true && isAppPublicLicensed) {
      // No need to do user validation
      this.organizationRepository.touchLastAccessedAt(app.organizationId);
      return true;
    }

    if (app.isPublic === true && !isAppPublicLicensed) {
      // License no longer covers public apps: treat this app as private for the rest of the
      // guard chain (group-permission check decides access), without rewriting the DB row.
      app.isPublic = false;
    }

    // Fall back to JWT authentication
    try {
      const authResult = await super.canActivate(context);
      return authResult;
    } catch {
      let organizationSlug: string | undefined;
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
