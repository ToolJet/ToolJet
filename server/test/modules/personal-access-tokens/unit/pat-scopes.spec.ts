import { FEATURE_KEY as GROUP_FEATURE } from '@modules/group-permissions/constants';
import { ForbiddenException } from '@nestjs/common';
import { MODULES } from '@modules/app/constants/modules';
import {
  PAT_ALLOWED_BUNDLES,
  PAT_APP_VIEWER_MODULES,
  PAT_APP_VIEWER_NEVER_GRANTABLE,
  PAT_BUNDLE_MODULES,
  PAT_NEVER_GRANTABLE,
  PAT_UNASSIGNED_MODULES,
  patAppViewerCanAccess,
  patCanAccess,
} from '@modules/personal-access-tokens/constants/scopes';
import { PersonalAccessTokenScope } from '@modules/external-apis/constants';
import { PatScopeInterceptor } from '@modules/personal-access-tokens/interceptors/pat-scope.interceptor';
import { FEATURE_KEY as ORGANIZATION_USER_FEATURE } from '@modules/organization-users/constants';
import { FEATURE_KEY as AUTH_FEATURE } from '@modules/auth/constants';
import { FEATURE_KEY as ORGANIZATION_CONSTANT_FEATURE } from '@modules/organization-constants/constants';
import { FEATURE_KEY as VERSION_FEATURE } from '@modules/versions/constants';
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

  it('never lets naming an app WIDEN the session', () => {
    /* The invariant the whole design rests on: an app-pinned session is a narrowing. Any feature
       the viewer surface grants must ALSO be reachable by the same token without an appId, OR be a
       deliberate viewer-only exception listed here — the boot calls a workspace token has no
       business making. ORGANIZATION_CONSTANT is why this test exists: granting the module reached
       plaintext workspace secrets that the same token could not otherwise touch at all. */
    const VIEWER_ONLY: Array<[MODULES, string | undefined]> = [
      [MODULES.AUTH, AUTH_FEATURE.AUTHORIZE],
      [MODULES.ORGANIZATION_CONSTANT, ORGANIZATION_CONSTANT_FEATURE.GET_FROM_APP],
      [MODULES.ORGANIZATION_CONSTANT, ORGANIZATION_CONSTANT_FEATURE.GET_FROM_ENVIRONMENT],
      [MODULES.CUSTOM_STYLES, undefined],
    ];
    const isViewerOnly = (module: MODULES, feature?: string) =>
      VIEWER_ONLY.some(([m, f]) => m === module && f === feature);

    // Everything the viewer surface can decrypt, mint or switch with must be denied.
    for (const feature of [
      ORGANIZATION_CONSTANT_FEATURE.GET_DECRYPTED_CONSTANTS,
      ORGANIZATION_CONSTANT_FEATURE.GET_SECRETS,
    ]) {
      expect(patAppViewerCanAccess(MODULES.ORGANIZATION_CONSTANT, feature)).toBe(false);
      expect(patCanAccess(MODULES.ORGANIZATION_CONSTANT, feature)).toBe(false);
    }
    expect(patAppViewerCanAccess(MODULES.AUTH, AUTH_FEATURE.SWITCH_WORKSPACE)).toBe(false);

    for (const module of PAT_APP_VIEWER_MODULES) {
      if (isViewerOnly(module, undefined) || VIEWER_ONLY.some(([m]) => m === module)) continue;
      expect(patCanAccess(module)).toBe(true);
    }
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

  const APP_ID = '11111111-1111-1111-1111-111111111111';
  const contextFor = (user: any, type = 'http', request: any = {}) =>
    ({
      getType: () => type,
      switchToHttp: () => ({
        getRequest: () => ({ user, method: 'GET', originalUrl: `/api/apps/${APP_ID}`, ...request }),
      }),
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
    //
    // Keyed on patScope, NOT on patAppId. The previous version of this test passed patAppId alone,
    // which is exactly the confusion being fixed: a workspace token can pin a session to an app
    // too, so "has an appId" no longer means "is an embed session".
    const embedSession = { isPATLogin: true, patScope: PersonalAccessTokenScope.APP, patAppId: 'some-app-id' };
    expect(interceptorFor(MODULES.ORGANIZATIONS).intercept(contextFor(embedSession), nextHandler)).toBe('HANDLED');
  });

  it('still exempts a pre-patScope embed session', () => {
    // Transitional. Sessions minted before patScope existed carry appId and nothing else; capping
    // them mid-flight would break every live embed the moment this deploys. Safe because until
    // this change ships, only the embed flow could put an appId on a JWT.
    const legacyEmbed = { isPATLogin: true, patAppId: 'some-app-id' };
    expect(interceptorFor(MODULES.ORGANIZATIONS).intercept(contextFor(legacyEmbed), nextHandler)).toBe('HANDLED');
  });

  it('does NOT exempt a workspace token merely because the session names an app', () => {
    // The regression this whole change exists to prevent. Before, this reached git-sync, SMTP,
    // licensing, audit logs and AI — everything the token owner's role allowed.
    const renderSession = {
      isPATLogin: true,
      patScope: PersonalAccessTokenScope.WORKSPACE,
      patAppId: APP_ID,
    };
    expect(() => interceptorFor(MODULES.ORGANIZATIONS).intercept(contextFor(renderSession), nextHandler)).toThrow(
      ForbiddenException
    );
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

describe('PatScopeInterceptor — app-pinned render session', () => {
  const nextHandler = { handle: () => 'HANDLED' } as any;
  const APP_ID = '11111111-1111-1111-1111-111111111111';
  const OTHER_APP_ID = '22222222-2222-2222-2222-222222222222';

  const session = { isPATLogin: true, patScope: PersonalAccessTokenScope.WORKSPACE, patAppId: APP_ID };

  /* The reflector is asked for 'tjModuleId' off the class and 'tjFeatureId' off the handler, so the
     stub has to answer differently per key — the feature-narrowed modules cannot be exercised with
     a reflector that returns the same value for both. */
  const run = (module: MODULES | undefined, feature?: string, request: any = {}) =>
    new PatScopeInterceptor({ get: (key: string) => (key === 'tjFeatureId' ? feature : module) } as any).intercept(
      {
        getType: () => 'http',
        switchToHttp: () => ({
          getRequest: () => ({ user: session, method: 'GET', originalUrl: `/api/apps/${APP_ID}`, ...request }),
        }),
        getClass: () => class {},
        getHandler: () => () => undefined,
      } as any,
      nextHandler
    );

  it('reaches /api/authorize, which an automation token may never touch', () => {
    // The whole point: AUTH is on PAT_NEVER_GRANTABLE for an automation token, and without it the
    // player redirects to /login and never renders.
    expect(run(MODULES.AUTH, AUTH_FEATURE.AUTHORIZE)).toBe('HANDLED');
  });

  it('reaches /api/authorize and nothing else on AUTH', () => {
    /* switchWorkspace is a GET on a workspace-level path, so neither the app pin nor the read-only
       rule touches it: a session pinned to one app could mint its way into another workspace. */
    expect(() => run(MODULES.AUTH, AUTH_FEATURE.SWITCH_WORKSPACE)).toThrow(ForbiddenException);
  });

  it('reads constants by app and environment, but never decrypts them', () => {
    /* The module as a whole reaches GET /organization-constants/decrypted?type=Secret — plaintext
       secrets for the entire workspace. No /apps/<uuid> in the path so the app pin does not fire,
       and it is a GET so read-only does not either. The same token WITHOUT an appId cannot reach
       this module at all, so granting it wholesale would mean naming an app WIDENED the session. */
    for (const feature of [
      ORGANIZATION_CONSTANT_FEATURE.GET_FROM_APP,
      ORGANIZATION_CONSTANT_FEATURE.GET_FROM_ENVIRONMENT,
    ]) {
      expect(run(MODULES.ORGANIZATION_CONSTANT, feature)).toBe('HANDLED');
    }
    for (const feature of [
      ORGANIZATION_CONSTANT_FEATURE.GET_DECRYPTED_CONSTANTS,
      ORGANIZATION_CONSTANT_FEATURE.GET_SECRETS,
    ]) {
      expect(() => run(MODULES.ORGANIZATION_CONSTANT, feature)).toThrow(ForbiddenException);
    }
  });

  it('fetches the app definition on a versioned boot', () => {
    /* useAppData only calls GET /v2/apps/:id/versions/:versionId when the URL carries ?version=,
       which the measured boot did not — so VERSION read as "never called" and was dropped. A
       versioned boot 403s without it. */
    expect(run(MODULES.VERSION, VERSION_FEATURE.GET_ONE)).toBe('HANDLED');
    expect(() => run(MODULES.VERSION, VERSION_FEATURE.APP_VERSION_UPDATE)).toThrow(ForbiddenException);
  });

  it('does not reach the rest of the credential surface', () => {
    // Measured: the editor boot never called either. Granting them would widen the credential
    // surface for nothing.
    for (const module of [MODULES.SESSION, MODULES.PROFILE]) {
      expect(() => run(module)).toThrow(ForbiddenException);
    }
  });

  it('reaches what the editor actually needs to paint', () => {
    // Every one of these was observed on the measured boot; DATA_SOURCE and CUSTOM_STYLES were
    // denied by the first draft of the list and had to be added.
    for (const module of [
      MODULES.APP,
      MODULES.APP_ENVIRONMENTS,
      MODULES.DATA_QUERY,
      MODULES.GLOBAL_DATA_SOURCE,
      MODULES.CUSTOM_STYLES,
    ]) {
      expect(run(module)).toBe('HANDLED');
    }
  });

  it('does not reach what the editor asked for but the render does not need', () => {
    // Observed on the boot and deliberately still refused: none of them changes what was painted.
    for (const module of [MODULES.AI, MODULES.APP_GIT, MODULES.DATA_QUERY_FOLDERS]) {
      expect(() => run(module)).toThrow(ForbiddenException);
    }
  });

  it('cannot reach workspace or instance administration', () => {
    for (const module of [MODULES.GIT_SYNC, MODULES.SMTP, MODULES.LICENSING, MODULES.AUDIT_LOGS, MODULES.AI]) {
      expect(() => run(module)).toThrow(ForbiddenException);
    }
  });

  it('cannot mint further tokens', () => {
    // A viewer session that could mint would launder itself into an unscoped one and survive
    // revocation of the workspace token it came from.
    expect(() => run(MODULES.PERSONAL_ACCESS_TOKENS)).toThrow(ForbiddenException);
  });

  it('is pinned to its own app', () => {
    expect(() => run(MODULES.APP, undefined, { originalUrl: `/api/apps/${OTHER_APP_ID}` })).toThrow(ForbiddenException);
    expect(() => run(MODULES.APP, undefined, { originalUrl: `/api/apps/${OTHER_APP_ID}/versions` })).toThrow(
      ForbiddenException
    );
    expect(run(MODULES.APP, undefined, { originalUrl: `/api/apps/${APP_ID}/versions` })).toBe('HANDLED');
  });

  it('names the app it refused, so the mismatch is debuggable', () => {
    expect(() => run(MODULES.APP, undefined, { originalUrl: `/api/apps/${OTHER_APP_ID}` })).toThrow(
      new RegExp(`scoped to a single app and cannot access ${OTHER_APP_ID}`)
    );
  });

  it("is read-only, except for running the app's queries", () => {
    // The player must execute queries to render anything, and that is a POST. Nothing else is.
    expect(() => run(MODULES.APP, undefined, { method: 'POST' })).toThrow(ForbiddenException);
    expect(() => run(MODULES.APP, undefined, { method: 'DELETE' })).toThrow(ForbiddenException);
    expect(() => run(MODULES.APP, undefined, { method: 'PUT' })).toThrow(ForbiddenException);
    expect(run(MODULES.DATA_QUERY, undefined, { method: 'POST', originalUrl: '/api/data-queries/abc-123/run' })).toBe(
      'HANDLED'
    );
    // The BUILDER run route, which is the one the render check actually uses — an unreleased app
    // can only be opened in the editor. Measured: six of these on a single boot.
    expect(
      run(MODULES.DATA_QUERY, undefined, {
        method: 'POST',
        originalUrl: '/api/data-queries/abc-123/versions/v-1/run/env-1?mode=edit',
      })
    ).toBe('HANDLED');
    // Not every data-queries POST: creating or updating a query is still a write.
    expect(() => run(MODULES.DATA_QUERY, undefined, { method: 'POST', originalUrl: '/api/data-queries' })).toThrow(
      ForbiddenException
    );
  });

  it('fails closed on a route with no module metadata', () => {
    expect(() => run(undefined)).toThrow(ForbiddenException);
  });
});

describe('PAT app-viewer surface', () => {
  it('keeps token minting unreachable', () => {
    for (const module of PAT_APP_VIEWER_NEVER_GRANTABLE) {
      expect(patAppViewerCanAccess(module)).toBe(false);
      expect(PAT_APP_VIEWER_MODULES).not.toContain(module);
    }
  });

  it('fails closed when a route carries no module metadata', () => {
    expect(patAppViewerCanAccess(undefined)).toBe(false);
  });

  it('grants a non-empty set of modules', () => {
    // An empty list would 403 the render check entirely — an outage no other test here catches.
    expect(PAT_APP_VIEWER_MODULES.length).toBeGreaterThan(0);
  });

  it('stays narrower than the workspace allowlist on administration', () => {
    // The viewer list is wider on the credential surface and MUST NOT be wider anywhere else.
    for (const module of [
      MODULES.GIT_SYNC,
      MODULES.SMTP,
      MODULES.LICENSING,
      MODULES.AUDIT_LOGS,
      MODULES.INSTANCE_SETTINGS,
      MODULES.ORGANIZATIONS,
      MODULES.GROUP_PERMISSIONS,
      MODULES.AI,
    ]) {
      expect(patAppViewerCanAccess(module)).toBe(false);
    }
  });
});
