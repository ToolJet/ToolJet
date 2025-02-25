import { Ability, InferSubjects, AbilityBuilder } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { FEATURE_KEY } from '../../constants';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

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

    const requestContext = request;
    const userAppPermissions = userPermission?.[MODULES.APP];
    const isAllAppsEditable = !!userAppPermissions?.isAllEditable;
    const isAllAppsCreatable = !!userPermission?.appCreate;

    const isEditableApp = requestContext.body?.app?.[0]?.id
      ? userAppPermissions?.editableAppsId.includes(requestContext.body?.app?.[0]?.id)
      : false;

    const appUpdateAllowed = userAppPermissions ? isAllAppsEditable || isEditableApp : false;

    if (isAllAppsCreatable || isAdmin || superAdmin) {
      can([FEATURE_KEY.APP_RESOURCE_IMPORT, FEATURE_KEY.APP_RESOURCE_EXPORT], App);
      if (appUpdateAllowed) {
        can([FEATURE_KEY.APP_RESOURCE_CLONE], App);
      }
    }
  }
}
