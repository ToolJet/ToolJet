import { EnvironmentPermissionSet, UserAppsPermissions } from 'src/modules/ability/types';
import { applyBuilderEnvironmentDefaults, getBasicPlanAppsGroupPermission } from '@ee/ability/app-permissions.util';
import { USER_ROLE } from 'src/modules/group-permissions/constants';

const envs = (development: boolean, staging: boolean, production: boolean, released: boolean) => ({
  canAccessDevelopment: development,
  canAccessStaging: staging,
  canAccessProduction: production,
  canAccessReleased: released,
});

const access = (development: boolean, staging: boolean, production: boolean, released: boolean) => ({
  development,
  staging,
  production,
  released,
});

const appsPermissions = (overrides: Partial<UserAppsPermissions> = {}): UserAppsPermissions => ({
  editableAppsId: [],
  isAllEditable: false,
  viewableAppsId: [],
  isAllViewable: false,
  hiddenAppsId: [],
  hideAll: false,
  ownedAppsId: [],
  environmentAccess: access(false, false, false, false),
  appSpecificEnvironmentAccess: {} as Record<string, EnvironmentPermissionSet>,
  ...overrides,
});

describe('app permissions', () => {
  describe('applyBuilderEnvironmentDefaults', () => {
    it('should give development and released access on editable apps with no explicit environments', () => {
      const permissions = appsPermissions({ editableAppsId: ['app-1'], ownedAppsId: ['app-1'] });

      applyBuilderEnvironmentDefaults(permissions, false);

      expect(permissions.appSpecificEnvironmentAccess['app-1']).toEqual({
        development: true,
        staging: false,
        production: false,
        released: true,
      });
    });

    it('should force production access when the licence has no multi-environment support', () => {
      const permissions = appsPermissions({ isAllEditable: true, environmentAccess: access(true, false, false, true) });

      applyBuilderEnvironmentDefaults(permissions, true);

      expect(permissions.environmentAccess).toEqual({ development: true, staging: false, production: true, released: true });
    });

    it('should keep explicit released access off for view-only apps', () => {
      const permissions = appsPermissions({
        viewableAppsId: ['app-3'],
        appSpecificEnvironmentAccess: { 'app-3': access(false, true, false, false) },
      });

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
