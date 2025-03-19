import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '@entities/user.entity';
import { VersionRepository } from '@modules/versions/repository';
import { AppsRepository } from '@modules/apps/repository';

@Injectable()
export class ValidateQueryAppGuard implements CanActivate {
  constructor(private readonly versionRepository: VersionRepository, private readonly appsRepository: AppsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { id, versionId } = request.params;
    const user: User = request.user;

    // Check if either id is provided, otherwise throw BadRequestException
    if (!id) {
      throw new BadRequestException();
    }

    // User is mandatory
    if (!user) {
      throw new ForbiddenException();
    }

    const app = await this.appsRepository.findByDataQuery(id, user.organizationId, versionId);

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
