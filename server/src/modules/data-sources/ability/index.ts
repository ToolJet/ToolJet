import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { DataSource } from '@entities/data_source.entity';
import { MODULES } from '@modules/app/constants/modules';

type Subjects = InferSubjects<typeof DataSource> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return DataSource;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): void {
    // Data source permissions
    // EE - data source create/delete -> full access
    // CE - Admin - full access. builder -> use access
    const { superAdmin, isAdmin, userPermission, isBuilder } = UserAllPermissions;

    const resourcePermissions = userPermission?.[MODULES.GLOBAL_DATA_SOURCE];
    const isAllEditable = !!resourcePermissions?.isAllConfigurable;
    const isCanCreate = userPermission.dataSourceCreate;
    const isCanDelete = userPermission.dataSourceDelete;
    const isAllViewable = !!resourcePermissions?.isAllUsable;

    const dataSourceId = request?.tj_resource_id;

    // Oauth end points available to all
    can(FEATURE_KEY.GET_OAUTH2_BASE_URL, DataSource);
    can(FEATURE_KEY.AUTHORIZE, DataSource);

    if (isBuilder) {
      // Only builder can do scope change, Get call is there on app builder
      can(FEATURE_KEY.SCOPE_CHANGE, DataSource);
      can(FEATURE_KEY.GET_FOR_APP, DataSource);
    }

    if (isAdmin || superAdmin) {
      // Admin or super admin and do all operations
      can(
        [
          FEATURE_KEY.CREATE,
          FEATURE_KEY.GET,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.DELETE,
          FEATURE_KEY.GET_BY_ENVIRONMENT,
          FEATURE_KEY.TEST_CONNECTION,
          FEATURE_KEY.SCOPE_CHANGE,
          FEATURE_KEY.GET_FOR_APP,
        ],
        DataSource
      );
      return;
    }

    if (isCanCreate || isCanDelete) {
      // Can create and can delete has master permissions
      can(
        [FEATURE_KEY.GET, FEATURE_KEY.UPDATE, FEATURE_KEY.GET_BY_ENVIRONMENT, FEATURE_KEY.TEST_CONNECTION],
        DataSource
      );

      if (isCanDelete) {
        can(FEATURE_KEY.DELETE, DataSource);
      }
      if (isCanCreate) {
        can(FEATURE_KEY.CREATE, DataSource);
      }
      return;
    }

    if (isAllEditable) {
      // All operations are available
      can(
        [FEATURE_KEY.GET, FEATURE_KEY.UPDATE, FEATURE_KEY.GET_BY_ENVIRONMENT, FEATURE_KEY.TEST_CONNECTION],
        DataSource
      );
      return;
    }

    if (resourcePermissions?.configurableDataSourceId?.length) {
      can([FEATURE_KEY.GET, FEATURE_KEY.TEST_CONNECTION, FEATURE_KEY.GET_BY_ENVIRONMENT], DataSource);

      if (dataSourceId && resourcePermissions?.configurableDataSourceId?.includes(dataSourceId)) {
        can(
          [FEATURE_KEY.GET, FEATURE_KEY.UPDATE, FEATURE_KEY.GET_BY_ENVIRONMENT, FEATURE_KEY.TEST_CONNECTION],
          DataSource
        );
      }
    }

    if (isAllViewable) {
      can([FEATURE_KEY.GET_BY_ENVIRONMENT, FEATURE_KEY.GET, FEATURE_KEY.TEST_CONNECTION], DataSource);
      return;
    }
    if (resourcePermissions.usableDataSourcesId?.length) {
      can([FEATURE_KEY.GET], DataSource);
      if (dataSourceId && resourcePermissions?.usableDataSourcesId?.includes(dataSourceId)) {
        can([FEATURE_KEY.TEST_CONNECTION], DataSource);
      }
      return;
    }
  }
}
