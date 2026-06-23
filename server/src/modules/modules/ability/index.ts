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
    userAllPermissions: UserAllPermissions,
    _extractedMetadata: { moduleName: string; features: string[] },
    request?: any
  ): void {
    const { superAdmin, isAdmin, isBuilder, userPermission } = userAllPermissions;
    const modulePerms = userPermission?.[MODULES.MODULES];
    const editableAppsId = modulePerms?.editableAppsId ?? [];
    const isAllEditable = modulePerms?.isAllEditable ?? false;

    // Resolve the actual App entity from request (set by ValidAppGuard) so we
    // can evaluate ownership / ID membership at rule-BUILD time rather than
    // relying on CASL condition objects.  Class-level checks (ability.can(action,
    // App, someString)) on conditional rules are permissive in CASL — they return
    // true whenever ANY matching rule exists, ignoring the conditions.  Emit
    // unconditional can() only after the JS-level check passes.
    const tjApp: App | undefined = request?.tj_app;

    // CREATE: module_create permission OR admin/superAdmin
    if (superAdmin || isAdmin || userPermission?.moduleCreate) {
      can(FEATURE_KEY.CREATE_MODULE, App);
    }

    // DELETE: module_delete permission OR admin/superAdmin → unconditional grant
    // ELSE: owner check resolved here against tjApp (never emit a condition object)
    if (superAdmin || isAdmin || userPermission?.moduleDelete) {
      can(FEATURE_KEY.DELETE_MODULE, App);
    } else if (tjApp && tjApp.userId === userAllPermissions.user.id) {
      can(FEATURE_KEY.DELETE_MODULE, App);
    }
    // No tjApp → no fallback (class-level CREATE-style calls without an app stay denied)

    // UPDATE: all-editable OR per-ID/owner check resolved against tjApp
    if (superAdmin || isAdmin || isAllEditable) {
      can(FEATURE_KEY.UPDATE_MODULE, App);
    } else if (tjApp) {
      if (editableAppsId.includes(tjApp.id)) {
        can(FEATURE_KEY.UPDATE_MODULE, App);
      } else if (tjApp.userId === userAllPermissions.user.id) {
        can(FEATURE_KEY.UPDATE_MODULE, App);
      }
    }

    // CLONE/EXPORT/IMPORT: builder or above (unchanged semantics)
    if (superAdmin || isAdmin || isBuilder) {
      can([FEATURE_KEY.CLONE_MODULE, FEATURE_KEY.EXPORT_MODULE, FEATURE_KEY.IMPORT_MODULE], App);
    }
  }
}
