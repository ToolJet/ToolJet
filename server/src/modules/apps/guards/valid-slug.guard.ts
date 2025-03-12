import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { AppsUtilService } from '../util.service';
import { User } from '@entities/user.entity';

// Assuming Slug passed can be Id or Slug
@Injectable()
export class ValidSlugGuard implements CanActivate {
  constructor(protected readonly appsUtilService: AppsUtilService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { slug } = request.params;
    const user: User = request.user;

    // Ensure slug and user are present, otherwise throw a BadRequestException
    if (!slug || !user) {
      throw new BadRequestException('Slug or User is missing');
    }

    // Fetch the app associated with the provided slug for the user's organization
    const app = await this.appsUtilService.findAppWithIdOrSlug(slug, user.organizationId);

    // If no app is found, throw a BadRequestException
    if (!app) {
      throw new BadRequestException('App not found with the provided slug');
    }

    // Attach the app to the request so that it can be accessed by the route handler
    request.tj_app = app;
    request.tj_resource_id = app.id;

    // Return true to allow the request to proceed
    return true;
  }
}
