import { Injectable, CanActivate, ExecutionContext, ConflictException } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { User } from '@entities/user.entity';
import { DataSource } from '@entities/data_source.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import {
  OpenApiSpecStatus,
  OPENAPI_SPEC_OPTION_KEYS,
  OPENAPI_V2_DATASOURCE_KIND,
} from '@modules/openapi-spec/constants';

/**
 * Blocks creating/updating a query on an openapiv2 datasource while its spec is still processing.
 * Runs after ValidateQuerySourceGuard, which sets request.tj_data_source.
 *
 * Queries the DB directly instead of injecting edition-split *UtilService classes: these routes
 * are inherited by the EE controller, so a CE-typed dependency throws UnknownDependenciesException under EE.
 */
@Injectable()
export class ValidateOpenApiSpecStatusGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const dataSource: DataSource = request.tj_data_source;
    if (!dataSource || dataSource.kind !== OPENAPI_V2_DATASOURCE_KIND) return true;

    const user: User = request.user;

    const isBlocked = await dbTransactionWrap(async (manager: EntityManager) => {
      const environments = await manager.find(AppEnvironment, {
        where: { organizationId: user.organizationId, enabled: true },
      });
      if (!environments.length) return false;

      const optionsRows = await manager.find(DataSourceOptions, {
        where: {
          dataSourceId: dataSource.id,
          environmentId: In(environments.map((environment) => environment.id)),
        },
      });

      return optionsRows.some((row) => {
        const status = row.options?.[OPENAPI_SPEC_OPTION_KEYS.STATUS]?.value;
        return status === OpenApiSpecStatus.PROCESSING || status === OpenApiSpecStatus.PENDING;
      });
    });

    if (isBlocked) {
      throw new ConflictException(
        'This OpenAPI datasource is currently processing a spec update. Please wait until processing completes before creating or updating queries.'
      );
    }

    return true;
  }
}
