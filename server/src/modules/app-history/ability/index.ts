import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { AppHistory } from '@entities/app_history.entity';
import { FEATURE_KEY } from '@modules/app-history/constants';
import { UserAllPermissions } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

type Subjects = InferSubjects<typeof AppHistory> | 'all';
export type AppHistoryAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return AppHistory;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<AppHistoryAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): void {
    const { superAdmin, isAdmin, userPermission } = UserAllPermissions;

    const appId = request?.tj_resource_id;
    const userAppPermissions = userPermission?.[MODULES.APP];
    const isAllAppsEditable = !!userAppPermissions?.isAllEditable;

    if (
      isAdmin ||
      superAdmin ||
      isAllAppsEditable ||
      (userAppPermissions?.editableAppsId?.length && appId && userAppPermissions.editableAppsId.includes(appId))
    ) {
      can(
        [
          FEATURE_KEY.LIST_HISTORY,
          FEATURE_KEY.RESTORE_HISTORY,
          FEATURE_KEY.UPDATE_DESCRIPTION,
          FEATURE_KEY.STREAM_HISTORY,
        ],
        AppHistory
      );
      return;
    }
  }
}
