import { Ability, InferSubjects, AbilityBuilder } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { FEATURE_KEY } from '../../constants';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';

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

    // Export matches the dashboard's Export option: create + edit on each resource, checked against
    // that resource type's own permissions. ToolJet Database tables need table create access (tjdbCRUD).
    const exportAppTypes: Record<string, string> = requestContext?.tj_export_app_types ?? {};
    const exportAppIds: string[] = (requestContext.body?.app ?? []).map((app) => app?.id).filter(Boolean);
    const canExportResource = (id: string) => {
      switch (exportAppTypes[id]) {
        case APP_TYPES.WORKFLOW: {
          const workflows = userPermission?.[MODULES.WORKFLOWS];
          return (
            !!userPermission?.workflowCreate &&
            (!!workflows?.isAllEditable || !!workflows?.editableWorkflowsId?.includes(id))
          );
        }
        case APP_TYPES.MODULE: {
          const modules = userPermission?.[MODULES.MODULES];
          return (
            !!userPermission?.moduleCreate && (!!modules?.isAllEditable || !!modules?.editableAppsId?.includes(id))
          );
        }
        case APP_TYPES.FRONT_END:
          return isAllAppsCreatable && (isAllAppsEditable || !!userAppPermissions?.editableAppsId?.includes(id));
        default:
          return false;
      }
    };
    const canExportApps = isAdmin || superAdmin || exportAppIds.every(canExportResource);
    const canExportTables =
      !requestContext.body?.tooljet_database?.length || isAdmin || superAdmin || !!userPermission?.tjdbCRUD;

    if (canExportApps && canExportTables) {
      can([FEATURE_KEY.APP_RESOURCE_EXPORT], App);
    }

    // A module import must be gated on module-create, not app-create — a builder with app-create
    // but without module-create may not import modules.
    const importDefinition = requestContext.body?.app?.[0]?.definition;
    const importedAppType = importDefinition?.appV2?.type ?? importDefinition?.type;
    const isModuleImport = importedAppType === APP_TYPES.MODULE;
    const canCreateForImport = isModuleImport ? !!userPermission?.moduleCreate : isAllAppsCreatable;

    if (canCreateForImport || isAdmin || superAdmin) {
      can([FEATURE_KEY.APP_RESOURCE_IMPORT], App);
      if (appUpdateAllowed) {
        can([FEATURE_KEY.APP_RESOURCE_CLONE], App);
      }
    }
  }
}
