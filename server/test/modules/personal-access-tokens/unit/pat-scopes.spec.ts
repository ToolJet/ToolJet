import { FEATURE_KEY as GROUP_FEATURE } from '@modules/group-permissions/constants';
import { ForbiddenException } from '@nestjs/common';
import { MODULES } from '@modules/app/constants/modules';
import {
  PAT_ALLOWED_BUNDLES,
  PAT_BUNDLE_MODULES,
  PAT_NEVER_GRANTABLE,
  PAT_UNASSIGNED_MODULES,
  patCanAccess,
} from '@modules/personal-access-tokens/constants/scopes';
import { PatScopeInterceptor } from '@modules/personal-access-tokens/interceptors/pat-scope.interceptor';
import { FEATURE_KEY as ORGANIZATION_USER_FEATURE } from '@modules/organization-users/constants';
import { FEATURE_KEY as PLUGIN_FEATURE } from '@modules/plugins/constants';

/**
 * Tagged `security` because CI's unit step runs only --group=working|workflows|security, and
 * jest-runner-groups EXCLUDES untagged specs — an untagged file here would pass locally and never
 * run in CI at all.
 *
 * @group security
 */
const allBundledModules = () => Object.values(PAT_BUNDLE_MODULES).flat();

describe('PAT scope definition', () => {
  it('never places the credential surface in a grantable bundle', () => {
    // If PERSONAL_ACCESS_TOKENS were ever grantable, a token could mint further tokens — a
    // persistence mechanism that survives revoking the original.
    for (const module of PAT_NEVER_GRANTABLE) {
      expect(allBundledModules()).not.toContain(module);
    }
  });

  it('assigns each module to at most one bundle', () => {
    const modules = allBundledModules();
    expect(new Set(modules).size).toBe(modules.length);
  });

  it('fails closed when a route carries no module metadata', () => {
    expect(patCanAccess(undefined)).toBe(false);
  });

  it('allows everything an app-building automation client calls', () => {
    // Derived from the endpoints the MCP server actually hits.
    for (const module of [
      MODULES.APP,
      MODULES.VERSION,
      MODULES.DATA_QUERY,
      MODULES.GLOBAL_DATA_SOURCE,
      MODULES.TOOLJET_DATABASE,
      MODULES.APP_ENVIRONMENTS,
      MODULES.ORGANIZATION_THEMES,
    ]) {
      expect(patCanAccess(module)).toBe(true);
    }
    for (const feature of [
      ORGANIZATION_USER_FEATURE.VIEW_ALL_USERS,
      ORGANIZATION_USER_FEATURE.USER_INVITE,
      ORGANIZATION_USER_FEATURE.USER_UPDATE,
      ORGANIZATION_USER_FEATURE.USER_ARCHIVE,
      ORGANIZATION_USER_FEATURE.USER_UNARCHIVE,
    ]) {
      expect(patCanAccess(MODULES.ORGANIZATION_USER, feature)).toBe(true);
    }
    expect(patCanAccess(MODULES.ORGANIZATION_USER, ORGANIZATION_USER_FEATURE.USER_ARCHIVE_ALL)).toBe(false);
  });

  it.each([MODULES.WORKFLOWS])('allows workflow module %s', (module) => {
    expect(patCanAccess(module)).toBe(true);
  });

  it.each(PAT_UNASSIGNED_MODULES)('denies unassigned module %s', (module) => {
    expect(patCanAccess(module)).toBe(false);
  });

  it('allows only the group operations needed for custom group management', () => {
    const allowed = new Set([
      GROUP_FEATURE.GET_ALL, GROUP_FEATURE.GET_ONE, GROUP_FEATURE.GET_ALL_GROUP_USER,
      GROUP_FEATURE.CREATE, GROUP_FEATURE.UPDATE, GROUP_FEATURE.DELETE, GROUP_FEATURE.DELETE_GROUP_USER,
      GROUP_FEATURE.DUPLICATE,
      GROUP_FEATURE.GET_ADDABLE_APPS,
      GROUP_FEATURE.GET_ADDABLE_DS,
      GROUP_FEATURE.GET_ALL_GRANULAR_PERMISSIONS,
      GROUP_FEATURE.CREATE_GRANULAR_APP_PERMISSIONS,
      GROUP_FEATURE.CREATE_GRANULAR_DATA_PERMISSIONS,
      GROUP_FEATURE.UPDATE_GRANULAR_APP_PERMISSIONS,
      GROUP_FEATURE.UPDATE_GRANULAR_DATA_PERMISSIONS,
      GROUP_FEATURE.DELETE_GRANULAR_APP_PERMISSIONS,
      GROUP_FEATURE.DELETE_GRANULAR_DATA_PERMISSIONS,
    ]);
    for (const feature of Object.values(GROUP_FEATURE)) {
      expect(patCanAccess(MODULES.GROUP_PERMISSIONS, feature)).toBe(allowed.has(feature));
    }
    expect(patCanAccess(MODULES.GROUP_PERMISSIONS)).toBe(false);
  });

  it('denies workspace and instance administration', () => {
    for (const module of [
      MODULES.ORGANIZATIONS,
      MODULES.LOGIN_CONFIGS,
      MODULES.INSTANCE_SETTINGS,
      MODULES.LICENSING,
      MODULES.PERSONAL_ACCESS_TOKENS,
    ]) {
      expect(patCanAccess(module)).toBe(false);
    }
  });

  it('allows installed spec reads without granting plugin administration', () => {
    expect(patCanAccess(MODULES.PLUGINS, PLUGIN_FEATURE.GET_SPEC)).toBe(true);
    for (const feature of Object.values(PLUGIN_FEATURE).filter((value) => value !== PLUGIN_FEATURE.GET_SPEC)) {
      expect(patCanAccess(MODULES.PLUGINS, feature)).toBe(false);
    }
    expect(patCanAccess(MODULES.PLUGINS)).toBe(false);
    expect(patCanAccess(MODULES.PLUGINS, 'unknown-feature')).toBe(false);
  });

  it('classifies every module, so a new area of the API cannot slip through unconsidered', () => {
    // Fails when someone adds a MODULES member without deciding whether a token may reach it.
    // Without this the default is a silent 403 that surfaces as a mystery integration bug.
    const classified = new Set([...allBundledModules(), ...PAT_UNASSIGNED_MODULES]);
    const unclassified = Object.values(MODULES).filter((m) => !classified.has(m));
    expect(unclassified).toEqual([]);
  });

  it('grants a non-empty set of modules', () => {
    // Deliberately does NOT pin the contents: widening the allowlist is a one-line policy change
    // and must not fail CI. What must hold is that it grants something — an empty or mis-populated
    // allowlist would 403 every token, an outage no other test here would catch.
    expect(PAT_ALLOWED_BUNDLES.flatMap((bundle) => PAT_BUNDLE_MODULES[bundle]).length).toBeGreaterThan(0);
  });

  it('keeps the credential surface unreachable whatever the allowlist contains', () => {
    // The invariant that must survive any future widening.
    for (const module of PAT_NEVER_GRANTABLE) {
      expect(patCanAccess(module)).toBe(false);
    }
  });
});

describe('PatScopeInterceptor', () => {
  const nextHandler = { handle: () => 'HANDLED' } as any;

  const contextFor = (user: any, type = 'http') =>
    ({
      getType: () => type,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getClass: () => class {},
      getHandler: () => () => undefined,
    }) as any;

  const interceptorFor = (module?: MODULES) => new PatScopeInterceptor({ get: () => module } as any);

  const pluginInterceptorFor = (feature: PLUGIN_FEATURE) =>
    new PatScopeInterceptor({ get: (key: string) => (key === 'tjModuleId' ? MODULES.PLUGINS : feature) } as any);

  it('lets a workspace PAT read installed specs but blocks plugin mutations', () => {
    const context = contextFor({ isPATLogin: true });
    expect(pluginInterceptorFor(PLUGIN_FEATURE.GET_SPEC).intercept(context, nextHandler)).toBe('HANDLED');
    for (const feature of [PLUGIN_FEATURE.INSTALL, PLUGIN_FEATURE.UPDATE, PLUGIN_FEATURE.DELETE]) {
      expect(() => pluginInterceptorFor(feature).intercept(context, nextHandler)).toThrow(ForbiddenException);
    }
  });

  it('ignores browser and SSO sessions entirely', () => {
    const user = { isPasswordLogin: true };
    // Even on a module no token may reach.
    expect(interceptorFor(MODULES.INSTANCE_SETTINGS).intercept(contextFor(user), nextHandler)).toBe('HANDLED');
  });

  it('ignores anonymous requests', () => {
    expect(interceptorFor(MODULES.APP).intercept(contextFor(undefined), nextHandler)).toBe('HANDLED');
  });

  it('exempts the app-scoped embed flow', () => {
    // An embedded app runs a whole viewer and legitimately needs more surface than an
    // automation client. Restricting it would regress a shipped feature.
    const embedSession = { isPATLogin: true, patAppId: 'some-app-id' };
    expect(interceptorFor(MODULES.ORGANIZATIONS).intercept(contextFor(embedSession), nextHandler)).toBe('HANDLED');
  });

  it('ignores non-HTTP contexts', () => {
    // Global interceptors also fire on the websocket gateways (yjs drives multiplayer editing),
    // where there is no HTTP request to inspect.
    const patSession = { isPATLogin: true };
    expect(interceptorFor(MODULES.ORGANIZATIONS).intercept(contextFor(patSession, 'ws'), nextHandler)).toBe('HANDLED');
  });

  it.each([MODULES.APP, MODULES.WORKFLOWS])('lets a workspace PAT through on allowed module %s', (module) => {
    const patSession = { isPATLogin: true };
    expect(interceptorFor(module).intercept(contextFor(patSession), nextHandler)).toBe('HANDLED');
  });

  it('enforces group feature limits for workspace PAT sessions', () => {
    for (const feature of [GROUP_FEATURE.CREATE, GROUP_FEATURE.DELETE_GROUP_USER, GROUP_FEATURE.DUPLICATE, GROUP_FEATURE.USER_ROLE_CHANGE]) {
      const interceptor = new PatScopeInterceptor({
        get: (key: string) => key === 'tjModuleId' ? MODULES.GROUP_PERMISSIONS : feature,
      } as any);
      const invoke = () => interceptor.intercept(contextFor({ isPATLogin: true }), nextHandler);
      if (feature === GROUP_FEATURE.USER_ROLE_CHANGE) expect(invoke).toThrow(ForbiddenException);
      else expect(invoke()).toBe('HANDLED');
    }
  });

  it('blocks a workspace PAT on a module outside the allowlist', () => {
    const patSession = { isPATLogin: true };
    expect(() => interceptorFor(MODULES.ORGANIZATIONS).intercept(contextFor(patSession), nextHandler)).toThrow(
      ForbiddenException
    );
  });

  it('blocks a workspace PAT on an unassigned module', () => {
    expect(() => interceptorFor(MODULES.AI).intercept(contextFor({ isPATLogin: true }), nextHandler)).toThrow(
      ForbiddenException
    );
  });

  it('names the resource and the limit in the denial', () => {
    const patSession = { isPATLogin: true };
    expect(() => interceptorFor(MODULES.INSTANCE_SETTINGS).intercept(contextFor(patSession), nextHandler)).toThrow(
      /This personal access token cannot access .+\. Workspace tokens are limited to: .+\./
    );
  });

  it('blocks a workspace PAT on a route with no module metadata', () => {
    const patSession = { isPATLogin: true };
    expect(() => interceptorFor(undefined).intercept(contextFor(patSession), nextHandler)).toThrow(ForbiddenException);
  });
});
