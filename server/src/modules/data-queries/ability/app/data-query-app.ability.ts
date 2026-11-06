import { AbilityBuilder } from '@casl/ability';
import { UserAllPermissions } from '@modules/app/types';
import { UserAppsPermissions } from '@modules/ability/types';
import { FEATURE_KEY } from '../../constants';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';
import { FeatureAbility } from './index';

/** A released front-end app that embeds a module (see DataQueryRepository.findParentAppsForModuleQuery). */
export type ModuleParentApp = { id: string; isPublic: boolean };

const VIEWER_FEATURES = [FEATURE_KEY.GET, FEATURE_KEY.RUN_VIEWER, FEATURE_KEY.RUN_EDITOR];

export function defineDataQueryAppAbility(
  can: AbilityBuilder<FeatureAbility>['can'],
  UserAllPermissions: UserAllPermissions,
  app: App,
  moduleParentApps: ModuleParentApp[] = []
): void {
  const appId = app?.id;
  const { superAdmin, isAdmin, userPermission } = UserAllPermissions;
  const isModule = app?.type === APP_TYPES.MODULE;
  // Modules resolve via their own MODULES.MODULES bucket (granular module permissions),
  // not the front-end app bucket — same mapping the guard used to fetch it.
  const resourcePermissions = userPermission?.[isModule ? MODULES.MODULES : MODULES.APP];
  const isAllEditable = !!resourcePermissions?.isAllEditable;
  const isCanCreate = isModule ? userPermission.moduleCreate : userPermission.appCreate;
  const isCanDelete = isModule ? userPermission.moduleDelete : userPermission.appDelete;
  const isAllViewable = !!resourcePermissions?.isAllViewable;

  if (app?.isPublic) {
    can([FEATURE_KEY.RUN_VIEWER], App);
  }

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
    can(
      [
        FEATURE_KEY.GET,
        FEATURE_KEY.UPDATE,
        FEATURE_KEY.UPDATE_DATA_SOURCE,
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
        FEATURE_KEY.UPDATE_DATA_SOURCE,
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
    can(VIEWER_FEATURES, App);
    return;
  }

  if (resourcePermissions?.viewableAppsId?.length && appId && resourcePermissions?.viewableAppsId?.includes(appId)) {
    can(VIEWER_FEATURES, App);
    return;
  }

  // Modules carry no viewer (end-user) permissions of their own. A module's query runs for whoever
  // can open an app that embeds it: a public parent, or one they can view through the app bucket.
  // Never grant by role alone — that would let a user run queries of apps they cannot open.
  if (isModule && canViewAnyParentApp(userPermission?.[MODULES.APP], moduleParentApps)) {
    can(VIEWER_FEATURES, App);
  }
}

function canViewAnyParentApp(appPermissions: UserAppsPermissions | undefined, parentApps: ModuleParentApp[]): boolean {
  if (!parentApps?.length) return false;
  if (parentApps.some((parent) => parent.isPublic)) return true;
  if (appPermissions?.isAllViewable || appPermissions?.isAllEditable) return true;
  const grantedAppIds = new Set([...(appPermissions?.viewableAppsId ?? []), ...(appPermissions?.editableAppsId ?? [])]);
  return parentApps.some((parent) => grantedAppIds.has(parent.id));
}
