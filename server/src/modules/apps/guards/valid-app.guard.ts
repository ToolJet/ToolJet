import { Injectable, CanActivate, ExecutionContext, BadRequestException, NotFoundException } from '@nestjs/common';
import { AppsRepository } from '../repository';
import { User } from '@entities/user.entity';

// Use this Guard IF
// - param id is passed as app id
// - param slug is passed as app slug
// IF slug is passed as id/slug -> USE validSlugGuard
// This Guard should be used after jwt auth guard
@Injectable()
export class ValidAppGuard implements CanActivate {
  constructor(protected readonly appRepository: AppsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { id, slug, versionId } = request.params;
    const user: User = request.user;

    // Check if either id or slug or user is provided, otherwise throw BadRequestException
    if (!(id || slug || user)) {
      throw new BadRequestException('App id or slug must be provided');
    }

    // Fetch the app based on the id or slug
    const app =
      request.tj_app ||
      (id
        ? await this.appRepository.findById(id, user.organizationId, versionId)
        : await this.appRepository.findBySlug(slug, user.organizationId, versionId));

    // If app is not found, throw NotFoundException
    if (!app) {
      throw new NotFoundException('App not found. Invalid app id or slug');
    }

    // Attach the found app to the request
    request.tj_app = app;
    request.tj_resource_id = app.id;

    // Return true to allow the request to proceed
    return true;
  }
}
