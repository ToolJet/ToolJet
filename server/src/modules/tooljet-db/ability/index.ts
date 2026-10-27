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

    // Instance-wide switch: only admins may modify ToolJet Database, regardless of group permissions.
    const isEditRestrictedToAdmins = process.env.TOOLJET_DB_DISABLE_BUILDER_EDIT === 'true' && !(superAdmin || isAdmin);
    // App queries reach PostgREST in-process and never pass this guard, so any proxy write here is a direct API call.
    const isBlockedProxyWrite = isEditRestrictedToAdmins && requestContext.method !== 'GET';

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
        ],
        InternalTable
      );
    }
    if (superAdmin || isAdmin || (isBuilder && !isEditRestrictedToAdmins)) {
      can([FEATURE_KEY.BULK_UPLOAD], InternalTable);
    }

    if (isPublicAppRequest) {
      can([FEATURE_KEY.PROXY_POSTGREST], InternalTable);
    }

    if (isUserLoggedin && (isAdmin || isBuilder || !orgMismatch) && !isBlockedProxyWrite) {
      //For logged in users only with valid organization and data query, allow proxy postgrest feature
      can([FEATURE_KEY.PROXY_POSTGREST], InternalTable);
    }

    can([FEATURE_KEY.VIEW_TABLE, FEATURE_KEY.VIEW_TABLES, FEATURE_KEY.JOIN_TABLES], InternalTable);
  }
}
