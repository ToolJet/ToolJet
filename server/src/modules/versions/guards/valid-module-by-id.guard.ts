import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@entities/user.entity';
import { AppsRepository } from '@modules/apps/repository';
import { APP_TYPES } from '@modules/apps/constants';

// Loads the module App and attaches it to the request so FeatureAbilityGuard's
// resource-type switch can read `request.tj_app.type`. Without this, that
// guard throws "Unsupported resource type: null" before the controller runs.
@Injectable()
export class ValidModuleByIdGuard implements CanActivate {
  constructor(private readonly appsRepository: AppsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { moduleAppId } = request.params;
    const user: User = request.user;

    if (!moduleAppId) {
      throw new BadRequestException('moduleAppId is required');
    }
    if (!user) {
      throw new ForbiddenException();
    }

    const app = await this.appsRepository.findOne({
      where: {
        id: moduleAppId,
        type: APP_TYPES.MODULE,
        organizationId: user.organizationId,
      },
    });

    if (!app) {
      throw new NotFoundException('Module not found');
    }

    request.tj_app = app;
    request.tj_resource_id = app.id;

    return true;
  }
}
