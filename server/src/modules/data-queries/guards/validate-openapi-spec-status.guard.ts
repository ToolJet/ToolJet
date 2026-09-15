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
 * Blocks creating/updating a query against an OpenAPI v2 datasource (kind: 'openapiv2', a
 * separate connector from the legacy 'openapi' plugin - see OPENAPI_V2_DATASOURCE_KIND) while
 * a spec upload is still being processed, since the operation index the query editor builds
 * against would be incomplete/about to be replaced. Runs after ValidateQuerySourceGuard, which
 * attaches the resolved datasource to request.tj_data_source.
 *
 * Deliberately has NO injected service dependencies (queries DataSourceOptions/AppEnvironment
 * directly via dbTransactionWrap) rather than going through DataSourcesUtilService/
 * AppEnvironmentUtilService. Those are edition-split (CE base + EE subclass resolved per
 * edition), but this guard is attached to create/updateDataQuery - routes defined on the CE
 * controller and simply inherited, unoverridden, by the EE controller. Since the @UseGuards
 * decorator on an inherited method is fixed to whatever class the CE file referenced, typing
 * this guard's constructor against the CE util service class would only ever resolve under CE
 * edition and throw UnknownDependenciesException under EE/Cloud, where the DI container has
 * the EE class registered instead. Matches the existing pattern: ValidateQuerySourceGuard/
 * ValidateDataSourceGuard (also attached to CE-defined/inherited routes) only depend on
 * plain, non-edition-split repositories - never on the *UtilService classes.
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
