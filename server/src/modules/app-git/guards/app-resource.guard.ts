import { Injectable, CanActivate, ExecutionContext, BadRequestException, NotFoundException } from '@nestjs/common';
import { AppsRepository } from '@modules/apps/repository';
import { User } from '@entities/user.entity';

// Use this Guard IF
// - param id is passed as app id
// - param slug is passed as app slug
// IF slug is passed as id/slug -> USE validSlugGuard
// This Guard should be used after jwt auth guard
@Injectable()
export class AppResourceGuard implements CanActivate {
  constructor(protected readonly appRepository: AppsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { appId } = request.params;
    const user: User = request.user;

    // Check if either id or slug or user is provided, otherwise throw BadRequestException
    if (!appId) {
      throw new BadRequestException('App id must be provided');
    }

    // Fetch the app based on the id or slug
    const app = request.tj_app || (appId && (await this.appRepository.findById(appId, user.organizationId)));

    // If app is not found, throw NotFoundException
    if (!app) {
      throw new NotFoundException('App not found. Invalid App id');
    }

    // Attach the found app to the request
    request.tj_app = app;
    request.tj_resource_id = app.id;
    return true;
  }
}
