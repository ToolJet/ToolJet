import { ExecutionContext, Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';
import { OrganizationRepository } from '@modules/organizations/repository';
import { AppsRepository } from '@modules/apps/repository';
import { TransactionLogger } from '@modules/logging/service';
import { APP_TYPES } from '@modules/apps/constants';
import { DataQueryRepository } from '../repository';

@Injectable()
export class QueryAuthGuard extends AuthGuard('jwt') {
  // This guard will allow access for unauthenticated user if the app is public
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly appRepository: AppsRepository,
    private readonly dataQueryRepository: DataQueryRepository,
    private readonly transactionLogger: TransactionLogger
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const { id } = request.params;

    try {
      // Check if either id is provided, otherwise throw BadRequestException
      if (!id) {
        throw new BadRequestException();
      }

      // findByDataQuery already overlays the canonical is_public for non-workflows
      // via AppsRepository.resolveMetadataVersion (workflows keep is_public on apps.*).
      const app = await this.appRepository.findByDataQuery(id);

      if (!app) {
        throw new BadRequestException();
      }

      const organization = await this.organizationRepository.getSingleOrganizationWithId(app?.organizationId);
      if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE) {
        throw new BadRequestException('Organization is Archived');
      }

      request.tj_app = app;
      request.tj_resource_id = app.id;

      // Public access reaches only the released version (as getBySlug does): a draft query of a
      // public app falls through to normal authentication below.
      if (
        app.isPublic === true &&
        (app.type !== APP_TYPES.FRONT_END || (await this.isReleasedQuery(app.currentVersionId, id)))
      ) {
        // No need to do user validation
        this.organizationRepository.touchLastAccessedAt(app.organizationId);
        return true;
      }

      if (app.type === APP_TYPES.MODULE) {
        // Module queries require authentication unless the module is embedded in a public parent app.
        let authenticated = false;
        try {
          authenticated = (await super.canActivate(context)) as boolean;
        } catch {
          // If the module is embedded in a public parent app, allow access and mark the module app as public
          const parentApp = await this.dataQueryRepository.findPublicParentAppForModuleQuery(app.id, id);
          if (parentApp) {
            app.isPublic = true;
            return true;
          }
          // If the module is not embedded in a public parent app, throw an unauthorized exception
          throw new UnauthorizedException(
            JSON.stringify({
              message: 'Authentication is required to access this app.',
            })
          );
        }
        // A module has no viewer permissions of its own: the data-query ability lets a signed-in user
        // run its queries only through a released app embedding it — a public one, or one they can view.
        if (authenticated) {
          request.tj_module_parent_apps = await this.dataQueryRepository.findParentAppsForModuleQuery(app.id, id);
        }
        return authenticated;
      }
      // Throw a custom exception if the app is not public
      try {
        return await super.canActivate(context);
      } catch {
        throw new UnauthorizedException(
          JSON.stringify({
            message: 'Authentication is required to access this app.',
          })
        );
      }
    } finally {
      this.transactionLogger.log(`QueryAuthGuard completed at ${new Date().toISOString()} for app id ${id}`);
    }
  }

  private async isReleasedQuery(releasedVersionId: string | null, dataQueryId: string): Promise<boolean> {
    if (!releasedVersionId) return false;
    return this.dataQueryRepository.existsBy({ id: dataQueryId, appVersionId: releasedVersionId });
  }
}
