import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { FEATURE_KEY } from '../constants';
import { UserAllPermissions } from '@modules/app/types';
import { InternalTable } from '@entities/internal_table.entity';
import { EntityManager } from 'typeorm';
import { isEmpty } from 'lodash';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { DataQuery } from '@entities/data_query.entity';
import { extractTableRefs } from '../helpers/postgrest-url-refs';

// The only proxy methods each ToolJet Database query operation uses.
const PROXY_METHODS_BY_OPERATION: Record<string, string[]> = {
  list_rows: ['GET', 'HEAD'],
  create_row: ['POST'],
  update_rows: ['PATCH'],
  delete_rows: ['DELETE'],
};

// A data query opens the proxy only for its own table and its own operation.
function isProxyRequestWithinDataQuery(request, dataQuery: DataQuery): boolean {
  const { operation, table_id: tableId } = (dataQuery?.options ?? {}) as Record<string, string>;
  if (!tableId || !PROXY_METHODS_BY_OPERATION[operation]?.includes(request?.method)) return false;

  let url: string;
  try {
    url = decodeURIComponent(request.originalUrl ?? request.url ?? '');
  } catch {
    return false;
  }
  // Name placeholders resolve to tables after this check, so they are refused outright.
  if (url.includes('${')) return false;

  const proxyTarget = url.match(/\/proxy(\/[^?]*)(\?.*)?$/);
  if (!proxyTarget) return false;
  const { path, embedded } = extractTableRefs(proxyTarget[1] + (proxyTarget[2] ?? ''));
  return path === tableId && embedded.every((embeddedTableId) => embeddedTableId === tableId);
}

type Subjects = InferSubjects<typeof InternalTable> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  constructor(
    protected manager: EntityManager,
    protected abilityService: AbilityService
  ) {
    super(abilityService);
  }

  protected getSubjectType() {
    return InternalTable;
  }

  protected async defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): Promise<void> {
    const { superAdmin, isAdmin, userPermission, isBuilder } = UserAllPermissions;

    const requestContext = request;
    const dataQueryId = requestContext.headers['data-query-id'];
    const organizationId =
      requestContext.headers['tj-workspace-id'] == 'null' ? null : requestContext.headers['tj-workspace-id'];

    let dataQuery: DataQuery;
    if (!isEmpty(dataQueryId)) {
      dataQuery = await this.manager.findOne(DataQuery, {
        where: { id: dataQueryId },
        relations: ['apps', 'appVersion'],
      });
    }
    // Every app type carries is_public on its own app_versions row.
    const isQueryPublic = dataQuery?.appVersion?.isPublic;
    const isPublicAppRequest = isEmpty(organizationId) && !isEmpty(dataQuery) && isQueryPublic;
    const isUserLoggedin = !isEmpty(requestContext.user) && !isEmpty(organizationId);
    const orgMismatch = !isEmpty(dataQuery) && dataQuery?.app?.organizationId !== organizationId;

    // Instance-wide switch: only admins may change ToolJet Database schema, regardless of group permissions.
    // The flag deliberately leaves proxy access alone: app code (e.g. RunJS) calls the proxy directly.
    const isEditRestrictedToAdmins = process.env.TOOLJET_DB_DISABLE_BUILDER_EDIT === 'true' && !(superAdmin || isAdmin);

    if (superAdmin || isAdmin || (userPermission.tjdbCRUD && !isEditRestrictedToAdmins)) {
      can(
        [
          FEATURE_KEY.CREATE_TABLE,
          FEATURE_KEY.DROP_TABLE,
          FEATURE_KEY.ADD_COLUMN,
          FEATURE_KEY.DROP_COLUMN,
          FEATURE_KEY.RENAME_TABLE,
          FEATURE_KEY.EDIT_COLUMN,
          FEATURE_KEY.ADD_FOREIGN_KEY,
          FEATURE_KEY.UPDATE_FOREIGN_KEY,
          FEATURE_KEY.DELETE_FOREIGN_KEY,
          FEATURE_KEY.PROMOTE_TABLE,
          FEATURE_KEY.PROMOTE_TABLE_PREVIEW,
          FEATURE_KEY.REPAIR_BASELINE,
          FEATURE_KEY.BASELINE_REPORT,
          FEATURE_KEY.ADD_RAW_SQL_MIGRATION,
          FEATURE_KEY.REVERT_MIGRATION,
        ],
        InternalTable
      );
    }
    if (superAdmin || isAdmin || (isBuilder && !isEditRestrictedToAdmins)) {
      can([FEATURE_KEY.BULK_UPLOAD, FEATURE_KEY.SQL_EXECUTION], InternalTable);
    }

    // Non-builder access to the proxy requires a resolved in-workspace data query.
    // `!orgMismatch` alone failed open (false when no data query is resolved).
    const isValidDataQueryForOrg = !isEmpty(dataQuery) && !orgMismatch;

    const isWithinDataQuery = isProxyRequestWithinDataQuery(requestContext, dataQuery);

    if (isPublicAppRequest && isWithinDataQuery) {
      can([FEATURE_KEY.PROXY_POSTGREST], InternalTable);
    }

    // Admins/builders (dashboard, App Builder editor); anyone else only through a data query of
    // their own workspace - without one, an end user would get raw access to every table.
    if (
      isUserLoggedin &&
      (isAdmin || isBuilder || userPermission.tjdbCRUD || (isValidDataQueryForOrg && isWithinDataQuery))
    ) {
      can([FEATURE_KEY.PROXY_POSTGREST], InternalTable);
    }

    // Viewing table metadata is a builder/admin action, not for end-users.
    if (superAdmin || isAdmin || isBuilder || userPermission.tjdbCRUD) {
      can(
        [FEATURE_KEY.VIEW_TABLE, FEATURE_KEY.VIEW_TABLES, FEATURE_KEY.TABLE_MIGRATIONS, FEATURE_KEY.TABLE_DEPENDENTS],
        InternalTable
      );
    }
  }
}
