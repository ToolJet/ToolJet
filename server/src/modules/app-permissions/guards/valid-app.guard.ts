import { Injectable, CanActivate, ExecutionContext, BadRequestException, NotFoundException } from '@nestjs/common';
import { AppsRepository } from '@modules/apps/repository';
import { User } from '@entities/user.entity';

@Injectable()
export class ValidAppGuard implements CanActivate {
  constructor(protected readonly appRepository: AppsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { appId } = request.params;
    const user: User = request.user;

    // Check if appId is provided, otherwise throw BadRequestException
    if (!appId) {
      throw new BadRequestException('App id must be provided');
    }

    // Fetch the app based on the id
    const app = await this.appRepository.findById(appId, user.organizationId);

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
