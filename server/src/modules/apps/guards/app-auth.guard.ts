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
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD, LICENSE_TYPE } from '@modules/licensing/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
@Injectable()
export class AppAuthGuard extends AuthGuard('jwt') {
  // This guard will allow access for unauthenticated user if the app is public
  constructor(
    protected readonly appUtilService: AppsUtilService,
    protected readonly organizationRepository: OrganizationRepository,
    protected readonly appRepository: AppsRepository,
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
    if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE)
      throw new BadRequestException('Organization is Archived');

    request.tj_app = app;
    request.tj_resource_id = app.id;
    request.headers['tj-workspace-id'] = app.organizationId;

    if (app.isPublic === true) {
      if (getTooljetEdition() === TOOLJET_EDITIONS.Cloud) {
        const licenseTerms = await this.licenseTermsService.getLicenseTerms(
          [LICENSE_FIELD.STATUS, LICENSE_FIELD.PLAN],
          app.organizationId
        );
        const { licenseType } = licenseTerms[LICENSE_FIELD.STATUS] ?? {};
        const planType: string | undefined = licenseTerms[LICENSE_FIELD.PLAN];
        if (licenseType === LICENSE_TYPE.BASIC || licenseType === LICENSE_TYPE.TRIAL || planType === 'starter') {
          throw new ForbiddenException('public-app-plan-restricted');
        }
      }
      // No need to do user validation
      this.organizationRepository.touchLastAccessedAt(app.organizationId);
      return true;
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
