import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from '@entities/user.entity';
import { DataSource } from '@entities/data_source.entity';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbilityFactory as DataSourceFeatureAbilityFactory } from '../ability/data-source';
import { FEATURE_KEY } from '../constants';

/**
 * Authorizes the data source a query is being moved to (`body.data_source_id`).
 *
 * The route's ValidateQuerySourceGuard / DataSourceFeatureAbilityGuard only see the query's
 * current data source. Moving a query onto a data source is equivalent to creating a query
 * against it, so the target must pass the same data-source ability check as query creation
 * (FEATURE_KEY.CREATE on that data source). A target outside the caller's workspace is a 404.
 *
 * Runs after DataSourceFeatureAbilityGuard so it reuses the permissions that guard resolved.
 */
@Injectable()
export class ValidateTargetDataSourceGuard implements CanActivate {
  constructor(
    private readonly dataSourceRepository: DataSourcesRepository,
    private readonly dataSourceAbilityFactory: DataSourceFeatureAbilityFactory
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;
    const targetDataSourceId: string = request.body?.data_source_id;

    if (!user) {
      throw new ForbiddenException();
    }

    const target: DataSource = targetDataSourceId
      ? await this.dataSourceRepository.findOne({
          where: { id: targetDataSourceId, organizationId: user.organizationId },
          select: ['id'],
        })
      : null;
    if (!target) {
      throw new NotFoundException('Data source not found');
    }

    // tj_resource_id is what the data-source ability scopes per-source grants by; evaluate it for
    // the target without disturbing the request's own resource.
    const ability = await this.dataSourceAbilityFactory.createAbility(
      user,
      { moduleName: MODULES.DATA_QUERY, features: [FEATURE_KEY.CREATE] },
      [{ resourceType: MODULES.GLOBAL_DATA_SOURCE }],
      { tj_resource_id: target.id, tj_user_permissions: request.tj_user_permissions }
    );

    if (!ability.can(FEATURE_KEY.CREATE, DataSource, target.id)) {
      throw new ForbiddenException('You do not have permission to use this data source');
    }
    return true;
  }
}
