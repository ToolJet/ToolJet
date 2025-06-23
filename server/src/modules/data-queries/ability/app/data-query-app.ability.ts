import { AbilityBuilder } from '@casl/ability';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../../constants';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbility } from './index';

export function defineDataQueryAppAbility(
  can: AbilityBuilder<FeatureAbility>['can'],
  UserAllPermissions: UserAllPermissions,
  appId?: string
): void {
  const { superAdmin, isAdmin, userPermission } = UserAllPermissions;
  const resourcePermissions = userPermission?.[MODULES.APP];
  const isAllEditable = !!resourcePermissions?.isAllEditable;
  const isCanCreate = userPermission.appCreate;
  const isCanDelete = userPermission.appDelete;
  const isAllViewable = !!resourcePermissions?.isAllViewable;

  // Always grant RUN_EDITOR and RUN_VIEWER permissions
  can([FEATURE_KEY.RUN_EDITOR, FEATURE_KEY.RUN_VIEWER], App);

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
    can([FEATURE_KEY.GET, FEATURE_KEY.PREVIEW, FEATURE_KEY.RUN_VIEWER, FEATURE_KEY.RUN_EDITOR], App);
    return;
  }

  if (resourcePermissions?.viewableAppsId?.length && appId && resourcePermissions?.viewableAppsId?.includes(appId)) {
    can([FEATURE_KEY.GET, FEATURE_KEY.PREVIEW, FEATURE_KEY.RUN_VIEWER, FEATURE_KEY.RUN_EDITOR], App);
    return;
  }
}
