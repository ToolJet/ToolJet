import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { App } from '@entities/app.entity';
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
    userAllPermissions: UserAllPermissions
  ): void {
    const { superAdmin, isAdmin, isBuilder, userPermission } = userAllPermissions;
    const modulePerms = userPermission?.[MODULES.MODULES];
    const editableAppsId = modulePerms?.editableAppsId ?? [];
    const isAllEditable = modulePerms?.isAllEditable ?? false;

    // CREATE: module_create permission OR admin/superAdmin
    if (superAdmin || isAdmin || userPermission?.moduleCreate) {
      can(FEATURE_KEY.CREATE_MODULE, App);
    }

    // DELETE: module_delete permission OR admin/superAdmin OR own module (owner)
    if (superAdmin || isAdmin || userPermission?.moduleDelete) {
      can(FEATURE_KEY.DELETE_MODULE, App);
    } else {
      // Creator can always delete their own module regardless of moduleDelete flag.
      // Guard evaluates this condition against the actual App instance (request.tj_app).
      can(FEATURE_KEY.DELETE_MODULE, App, { userId: userAllPermissions.user.id });
    }

    // UPDATE: all-editable (isAllEditable) OR specific IDs in editableAppsId (which includes owned modules)
    if (superAdmin || isAdmin || isAllEditable) {
      can(FEATURE_KEY.UPDATE_MODULE, App);
    } else if (editableAppsId.length > 0) {
      // editableAppsId already includes modules owned by this user (via createUserModulesPermissions)
      can(FEATURE_KEY.UPDATE_MODULE, App, { id: { $in: editableAppsId } } as any);
    }

    // CLONE/EXPORT/IMPORT: builder or above (unchanged semantics)
    if (superAdmin || isAdmin || isBuilder) {
      can([FEATURE_KEY.CLONE_MODULE, FEATURE_KEY.EXORT_MODULE, FEATURE_KEY.IMPORT_MODULE], App);
    }
  }
}
