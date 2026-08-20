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
    ]) {
      expect(patCanAccess(module)).toBe(true);
    }
  });

  it('denies workspace and instance administration', () => {
    for (const module of [
      MODULES.ORGANIZATIONS,
      MODULES.ORGANIZATION_USER,
      MODULES.GROUP_PERMISSIONS,
      MODULES.LOGIN_CONFIGS,
      MODULES.INSTANCE_SETTINGS,
      MODULES.LICENSING,
      MODULES.PERSONAL_ACCESS_TOKENS,
    ]) {
      expect(patCanAccess(module)).toBe(false);
    }
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

  it('lets a workspace PAT through on an allowed module', () => {
    const patSession = { isPATLogin: true };
    expect(interceptorFor(MODULES.APP).intercept(contextFor(patSession), nextHandler)).toBe('HANDLED');
  });

  it('blocks a workspace PAT on a module outside the allowlist', () => {
    const patSession = { isPATLogin: true };
    expect(() => interceptorFor(MODULES.ORGANIZATIONS).intercept(contextFor(patSession), nextHandler)).toThrow(
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
