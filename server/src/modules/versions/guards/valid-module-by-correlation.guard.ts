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
 * Resolve the module App from the `:coRelationId` path param and attach it to
 * the request for downstream guards (specifically FeatureAbilityGuard, whose
 * resource-type switch reads `request.tj_app.type`).
 *
 * Without this guard, getModuleVersionByStableIds hits FeatureAbilityGuard with
 * no tj_app on the request → getResource() returns null → createVersionAbility
 * throws "Unsupported resource type: null" before the service method runs.
 *
 * Scoped to the user's organization because `co_relation_id` is only unique
 * per-org (two workspaces importing the same module from git share the id).
 */
@Injectable()
export class ValidModuleByCorrelationGuard implements CanActivate {
  constructor(private readonly appsRepository: AppsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { coRelationId } = request.params;
    const user: User = request.user;

    if (!coRelationId) {
      throw new BadRequestException('coRelationId is required');
    }
    if (!user) {
      throw new ForbiddenException();
    }

    const app = await this.appsRepository.findOne({
      where: {
        co_relation_id: coRelationId,
        type: APP_TYPES.MODULE,
        organizationId: user.organizationId,
      },
      order: { createdAt: 'ASC' },
    });

    if (!app) {
      throw new NotFoundException('Module not found');
    }

    request.tj_app = app;
    request.tj_resource_id = app.id;

    return true;
  }
}
