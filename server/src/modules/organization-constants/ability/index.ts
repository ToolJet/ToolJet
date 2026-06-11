import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { OrganizationConstant } from '@entities/organization_constants.entity';
import { MODULES } from '@modules/app/constants/modules';

type Subjects = InferSubjects<typeof OrganizationConstant> | 'all';
export type OrganizationConstantAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return OrganizationConstant;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<OrganizationConstantAbility>['can'],
    UserAllPermissions: UserAllPermissions,
    extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): void {
    const appId = request?.tj_resource_id;
    const app = request?.tj_app;
    const { superAdmin, isAdmin, userPermission, isBuilder } = UserAllPermissions;
    const orgConstantPermission = userPermission?.orgConstantCRUD;
    const userAppPermissions = userPermission?.[MODULES.APP];
    const isAllAppsViewable = !!userAppPermissions?.isAllViewable;

    if (app?.isPublic) {
      // If the app is public, allow viewing constants
      can([FEATURE_KEY.GET_PUBLIC], OrganizationConstant);
    }

    // If the user has organization constant permission
    if (isAdmin || superAdmin || orgConstantPermission) {
      can(
        [
          FEATURE_KEY.CREATE,
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.DELETE,
          FEATURE_KEY.GET_DECRYPTED_CONSTANTS,
          FEATURE_KEY.GET_FROM_APP,
          FEATURE_KEY.GET_FROM_ENVIRONMENT,
          FEATURE_KEY.GET_SECRETS,
        ],
        OrganizationConstant
      );
    }

    if (isBuilder) {
      // If the user is a builder, they can only view constants
      can([FEATURE_KEY.GET_FROM_APP, FEATURE_KEY.GET_FROM_ENVIRONMENT], OrganizationConstant);
    }

    if (
      isAllAppsViewable ||
      (userAppPermissions?.viewableAppsId?.length && appId && userAppPermissions.viewableAppsId.includes(appId))
    ) {
      can(FEATURE_KEY.GET_FROM_APP, OrganizationConstant);
    }

    // All users can view constants
    can([FEATURE_KEY.GET_FROM_APP, FEATURE_KEY.GET_FROM_ENVIRONMENT], OrganizationConstant);
  }
}
