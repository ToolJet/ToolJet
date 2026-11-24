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
    const { superAdmin, isAdmin, userPermission } = userAllPermissions;
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

    // CREATE / IMPORT / CLONE all produce a NEW module → gate on module_create OR admin/superAdmin.
    if (superAdmin || isAdmin || userPermission?.moduleCreate) {
      can([FEATURE_KEY.CREATE_MODULE, FEATURE_KEY.IMPORT_MODULE, FEATURE_KEY.CLONE_MODULE], App);
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

    // EXPORT matches /v2/resources/export: module-create + edit on each requested module, and
    // ToolJet Database tables need tjdbCRUD. Ids the guard didn't resolve to a module are denied.
    const exportModuleIds = new Set<string>(request?.tj_export_module_ids ?? []);
    const exportIds: string[] = (request?.body?.app ?? []).map((app) => app?.id).filter(Boolean);
    const canExportModules = exportIds.every(
      (id) => exportModuleIds.has(id) && (isAllEditable || editableAppsId.includes(id))
    );
    const canExportTables = !request?.body?.tooljet_database?.length || !!userPermission?.tjdbCRUD;
    if (superAdmin || isAdmin || (userPermission?.moduleCreate && canExportModules && canExportTables)) {
      can(FEATURE_KEY.EXPORT_MODULE, App);
    }
  }
}
