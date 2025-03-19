import { ExecutionContext, Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';
import { OrganizationRepository } from '@modules/organizations/repository';
import { AppsRepository } from '@modules/apps/repository';

@Injectable()
export class QueryAuthGuard extends AuthGuard('jwt') {
  // This guard will allow access for unauthenticated user if the app is public
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly appRepository: AppsRepository
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const { id } = request.params;

    // Check if either id is provided, otherwise throw BadRequestException
    if (!id) {
      throw new BadRequestException();
    }

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

    if (app.isPublic === true) {
      // No need to do user validation
      return true;
    }

    // Throw a custom exception if the app is not public
    try {
      return await super.canActivate(context);
    } catch (error) {
      throw new UnauthorizedException(
        JSON.stringify({
          message: 'Authentication is required to access this app.',
        })
      );
    }
  }
}
