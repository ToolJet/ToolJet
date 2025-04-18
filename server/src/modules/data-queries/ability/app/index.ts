import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../../constants';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';

type Subjects = InferSubjects<typeof App> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return App;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<FeatureAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): void {
    const { superAdmin, isAdmin, userPermission } = UserAllPermissions;

    const resourcePermissions = userPermission?.[MODULES.APP];
    const isAllEditable = !!resourcePermissions?.isAllEditable;
    const isCanCreate = userPermission.appCreate;
    const isCanDelete = userPermission.appDelete;
    const isAllViewable = !!resourcePermissions?.isAllViewable;

    const appId = request?.tj_resource_id;

    // Admin or super admin and do all operations
    if (isAdmin || superAdmin) {
      can(
        [
          FEATURE_KEY.CREATE,
          FEATURE_KEY.GET,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.DELETE,
          FEATURE_KEY.UPDATE_DATA_SOURCE,
          FEATURE_KEY.UPDATE_ONE,
          FEATURE_KEY.RUN_EDITOR,
          FEATURE_KEY.RUN_VIEWER,
          FEATURE_KEY.PREVIEW,
        ],
        App
      );
      return;
    }

    if (isAllEditable || isCanCreate || isCanDelete) {
      // Can create and can delete has master permissions
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
        App
      );
      return;
    }

    if (resourcePermissions?.editableAppsId?.length && appId && resourcePermissions?.editableAppsId?.includes(appId)) {
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
        App
      );
      return;
    }

    if (isAllViewable) {
      can([FEATURE_KEY.GET, FEATURE_KEY.PREVIEW, FEATURE_KEY.RUN_VIEWER], App);
      return;
    }
    if (resourcePermissions?.viewableAppsId?.length && appId && resourcePermissions?.viewableAppsId?.includes(appId)) {
      can([FEATURE_KEY.GET, FEATURE_KEY.PREVIEW, FEATURE_KEY.RUN_VIEWER], App);
      return;
    }
  }
}
