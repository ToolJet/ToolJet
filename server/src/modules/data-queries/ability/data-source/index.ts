import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../../constants';
import { MODULES } from '@modules/app/constants/modules';
import { DataSource } from '@entities/data_source.entity';

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
    const { superAdmin, isAdmin, userPermission } = UserAllPermissions;

    const resourcePermissions = userPermission?.[MODULES.GLOBAL_DATA_SOURCE];
    const isAllEditable = !!resourcePermissions?.isAllConfigurable;
    const isCanCreate = userPermission.dataSourceCreate;
    const isCanDelete = userPermission.dataSourceDelete;
    const isAllViewable = !!resourcePermissions?.isAllUsable;

    const dataSourceId = request?.tj_resource_id;

    // Define permissions for data queries

    if (isAdmin || superAdmin || isAllEditable || isCanCreate || isCanDelete) {
      can(
        [
          FEATURE_KEY.CREATE,
          FEATURE_KEY.GET,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.DELETE,
          FEATURE_KEY.RUN_VIEWER,
          FEATURE_KEY.PREVIEW,
          FEATURE_KEY.UPDATE_DATA_SOURCE,
          FEATURE_KEY.UPDATE_ONE,
          FEATURE_KEY.RUN_EDITOR,
        ],
        DataSource
      );
      return;
    }

    if (
      resourcePermissions?.configurableDataSourceId?.length &&
      dataSourceId &&
      resourcePermissions?.configurableDataSourceId?.includes(dataSourceId)
    ) {
      can(
        [
          FEATURE_KEY.CREATE,
          FEATURE_KEY.GET,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.DELETE,
          FEATURE_KEY.RUN_VIEWER,
          FEATURE_KEY.PREVIEW,
          FEATURE_KEY.UPDATE_DATA_SOURCE,
          FEATURE_KEY.UPDATE_ONE,
          FEATURE_KEY.RUN_EDITOR,
        ],
        DataSource
      );
    }
    if (isAllViewable) {
      can(
        [
          FEATURE_KEY.GET,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.UPDATE_ONE,
          FEATURE_KEY.RUN_EDITOR,
          FEATURE_KEY.RUN_VIEWER,
          FEATURE_KEY.PREVIEW,
          FEATURE_KEY.DELETE,
          FEATURE_KEY.CREATE,
        ],
        DataSource
      );
      return;
    }
    if (
      resourcePermissions.usableDataSourcesId?.length &&
      dataSourceId &&
      resourcePermissions?.usableDataSourcesId?.includes(dataSourceId)
    ) {
      can(
        [
          FEATURE_KEY.GET,
          FEATURE_KEY.CREATE,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.DELETE,
          FEATURE_KEY.RUN_VIEWER,
          FEATURE_KEY.PREVIEW,
          FEATURE_KEY.UPDATE_ONE,
          FEATURE_KEY.RUN_EDITOR,
        ],
        DataSource
      );
    }
  }
}
