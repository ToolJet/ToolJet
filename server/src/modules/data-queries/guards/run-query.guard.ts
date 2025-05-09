import { Injectable, CanActivate, ExecutionContext, BadRequestException, NotFoundException } from '@nestjs/common';
import { User } from '@entities/user.entity';
import { App } from '@entities/app.entity';
import { AppsRepository } from '@modules/apps/repository';

@Injectable()
export class RunQuerySourceGuard implements CanActivate {
  constructor(private readonly appsRepository: AppsRepository) {}

  // This Guard is for Query run in Viewer mode
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { id, versionId } = request.params;
    const user: User = request.user;

    let app: App = request.tj_app;

    if (app?.isPublic) {
      return true;
    }

    // Check if id should be mandatory
    if (!(id && user)) {
      throw new BadRequestException();
    }

    if (!app) {
      app = await this.appsRepository.findByDataQuery(id, user.organizationId, versionId);
    }

    // If app is not found, throw NotFoundException
    if (!app) {
      throw new NotFoundException('App not found');
    }

    // Attach the found app to the request
    request.tj_app = app;
    request.tj_resource_id = app.id;

    // Return true to allow the request to proceed
    return true;
  }
}
