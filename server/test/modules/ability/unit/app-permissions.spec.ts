import { AbilityUtilService } from 'src/modules/ability/util.service';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { applyBuilderEnvironmentDefaults, getBasicPlanAppsGroupPermission } from '@ee/ability/app-permissions.util';
import { USER_ROLE } from 'src/modules/group-permissions/constants';

const envs = (development: boolean, staging: boolean, production: boolean, released: boolean) => ({
  canAccessDevelopment: development,
  canAccessStaging: staging,
  canAccessProduction: production,
  canAccessReleased: released,
});

const rule = (isAll: boolean, flags: Record<string, unknown>, appIds: string[] = []) =>
  ({
    isAll,
    appsGroupPermissions: { ...flags, groupApps: appIds.map((appId) => ({ appId })) },
  } as unknown as GranularPermissions);

describe('app permissions', () => {
  describe('buildUserAppsPermissions', () => {
    it('should merge all-app and selected-app rules with OR', () => {
      const permissions = AbilityUtilService.buildUserAppsPermissions([
        rule(true, { canView: true, canEdit: false, ...envs(false, false, false, true) }),
        rule(false, { canEdit: true, hideFromDashboard: true, ...envs(true, false, false, false) }, ['app-1']),
      ]);

      expect(permissions).toMatchObject({
        isAllViewable: true,
        isAllEditable: false,
        editableAppsId: ['app-1'],
        hiddenAppsId: ['app-1'],
        environmentAccess: { development: false, staging: false, production: false, released: true },
        appSpecificEnvironmentAccess: { 'app-1': { development: true, staging: false, production: false, released: false } },
      });
    });

    it('should make owned apps editable', () => {
      const permissions = AbilityUtilService.buildUserAppsPermissions([], ['app-2']);

      expect(permissions.ownedAppsId).toEqual(['app-2']);
      expect(permissions.editableAppsId).toEqual(['app-2']);
      expect(permissions.viewableAppsId).toEqual([]);
    });

    it('should also make owned apps viewable when owners get view access', () => {
      const permissions = AbilityUtilService.buildUserAppsPermissions([], ['module-1'], true);

      expect(permissions.viewableAppsId).toEqual(['module-1']);
    });
  });

  describe('applyBuilderEnvironmentDefaults', () => {
    it('should give development and released access on editable apps with no explicit environments', () => {
      const permissions = AbilityUtilService.buildUserAppsPermissions([], ['app-1']);

      applyBuilderEnvironmentDefaults(permissions, false);

      expect(permissions.appSpecificEnvironmentAccess['app-1']).toEqual({
        development: true,
        staging: false,
        production: false,
        released: true,
      });
    });

    it('should force production access when the licence has no multi-environment support', () => {
      const permissions = AbilityUtilService.buildUserAppsPermissions([
        rule(true, { canEdit: true, ...envs(true, false, false, true) }),
      ]);

      applyBuilderEnvironmentDefaults(permissions, true);

      expect(permissions.environmentAccess).toEqual({ development: true, staging: false, production: true, released: true });
    });

    it('should keep explicit released access off for view-only apps', () => {
      const permissions = AbilityUtilService.buildUserAppsPermissions([
        rule(false, { canView: true, ...envs(false, true, false, false) }, ['app-3']),
      ]);

      applyBuilderEnvironmentDefaults(permissions, false);

      expect(permissions.appSpecificEnvironmentAccess['app-3']).toEqual({
        development: false,
        staging: true,
        production: false,
        released: false,
      });
    });
  });

  describe('getBasicPlanAppsGroupPermission', () => {
    it('should let admins and builders edit every environment', () => {
      for (const role of [USER_ROLE.ADMIN, USER_ROLE.BUILDER]) {
        expect(getBasicPlanAppsGroupPermission(role)).toMatchObject({ canEdit: true, ...envs(true, true, true, true) });
      }
    });

    it('should let end-users view released apps only', () => {
      expect(getBasicPlanAppsGroupPermission(USER_ROLE.END_USER)).toMatchObject({
        canView: true,
        ...envs(false, false, false, true),
      });
    });

    it('should grant nothing for custom groups', () => {
      expect(getBasicPlanAppsGroupPermission('Finance')).toBeNull();
    });
  });
});
