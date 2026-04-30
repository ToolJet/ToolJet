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

/**
 * Resolve the module App from the `:moduleAppId` path param and attach it to
 * the request for downstream guards (specifically FeatureAbilityGuard, whose
 * resource-type switch reads `request.tj_app.type`).
 *
 * Without this guard, getModuleVersion hits FeatureAbilityGuard with no tj_app
 * on the request → getResource() returns null → createVersionAbility throws
 * "Unsupported resource type: null" before the service method runs.
 *
 * The path param carries the module's local `apps.id` —
 * `properties.moduleAppId.value` stores local DB ids since the boundary-only
 * refactor (AppSnapshot translates cor_id ↔ local id at every push/pull/import
 * /export). Org scope is enforced for defence in depth.
 */
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
