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

    if (superAdmin || isAdmin || userPermission.tjdbCRUD) {
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
    if (superAdmin || isAdmin || isBuilder) {
      can([FEATURE_KEY.BULK_UPLOAD], InternalTable);
    }

    // Non-builder access to proxy/join requires a resolved in-workspace data query.
    // `!orgMismatch` alone failed open (false when no data query is resolved).
    const isValidDataQueryForOrg = !isEmpty(dataQuery) && !orgMismatch;

    if (isPublicAppRequest) {
      can([FEATURE_KEY.PROXY_POSTGREST, FEATURE_KEY.JOIN_TABLES], InternalTable);
    }

    if (isUserLoggedin && (isAdmin || isBuilder || userPermission.tjdbCRUD || isValidDataQueryForOrg)) {
      can([FEATURE_KEY.PROXY_POSTGREST, FEATURE_KEY.JOIN_TABLES], InternalTable);
    }

    // Viewing table metadata is a builder/admin action, not for end-users.
    if (superAdmin || isAdmin || isBuilder || userPermission.tjdbCRUD) {
      can([FEATURE_KEY.VIEW_TABLE, FEATURE_KEY.VIEW_TABLES], InternalTable);
    }
  }
}
