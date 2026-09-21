import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY as ORGANIZATION_USER_FEATURE } from '@modules/organization-users/constants';
import { FEATURE_KEY as AUTH_FEATURE } from '@modules/auth/constants';
import { FEATURE_KEY as ORGANIZATION_CONSTANT_FEATURE } from '@modules/organization-constants/constants';
import { FEATURE_KEY as VERSION_FEATURE } from '@modules/versions/constants';

/**
 * What a WORKSPACE personal access token may reach.
 *
 * Deliberately a code-level constant rather than per-token data: every workspace PAT gets the same
 * ceiling, so there is nothing to configure, nothing to migrate, and no way to mint an
 * accidentally-unrestricted token. Widening access means adding a bundle to PAT_ALLOWED_BUNDLES —
 * a visible, reviewable change.
 *
 * Grouped into bundles rather than listing raw module names so that widening is a decision about
 * capability ("should tokens be able to administer the workspace?") instead of a judgement about
 * internal identifiers nobody can weigh in review.
 *
 * This does NOT apply to the app-scoped embed flow (patScope='app'), which runs a whole app viewer
 * and legitimately needs far more than an automation client, nor to an app-pinned session minted
 * from a workspace token, which gets PAT_APP_VIEWER_MODULES instead — see below.
 */
export enum PAT_BUNDLE {
  APPS = 'apps',
  DATA = 'data',
  WORKFLOWS = 'workflows',
  WORKSPACE_USERS = 'workspace_users',
  WORKSPACE_ADMIN = 'workspace_admin',
  INSTANCE_ADMIN = 'instance_admin',
}

export const PAT_BUNDLE_MODULES: Record<PAT_BUNDLE, MODULES[]> = {
  [PAT_BUNDLE.APPS]: [
    MODULES.APP,
    MODULES.VERSION,
    MODULES.APP_HISTORY,
    MODULES.APP_PERMISSIONS,
    MODULES.APP_GIT,
    MODULES.FOLDER,
    MODULES.FOLDER_APPS,
    MODULES.MODULES,
    MODULES.IMPORT_EXPORT_RESOURCES,
    MODULES.TEMPLATES,
    MODULES.COMMENT,
    MODULES.THREAD,
    MODULES.FILE,
    MODULES.ORGANIZATION_THEMES,
  ],
  [PAT_BUNDLE.DATA]: [
    MODULES.DATA_QUERY,
    MODULES.DATA_QUERY_FOLDERS,
    MODULES.GLOBAL_DATA_SOURCE,
    MODULES.TOOLJET_DATABASE,
    MODULES.APP_ENVIRONMENTS,
  ],
  [PAT_BUNDLE.WORKFLOWS]: [MODULES.WORKFLOWS],
  [PAT_BUNDLE.WORKSPACE_USERS]: [MODULES.ORGANIZATION_USER],
  [PAT_BUNDLE.WORKSPACE_ADMIN]: [
    MODULES.ORGANIZATIONS,
    MODULES.USER,
    MODULES.GROUP_PERMISSIONS,
    MODULES.ORGANIZATION_CONSTANT,
    MODULES.ORGANIZATION_VARIABLE,
    MODULES.ORGANIZATION_PAYMENTS,
    MODULES.CUSTOM_STYLES,
    MODULES.CUSTOM_DOMAINS,
    MODULES.WHITE_LABELLING,
    MODULES.LOGIN_CONFIGS,
    MODULES.GIT_SYNC,
    MODULES.SMTP,
    MODULES.CONFIGS,
  ],
  [PAT_BUNDLE.INSTANCE_ADMIN]: [
    MODULES.INSTANCE_SETTINGS,
    MODULES.LICENSING,
    MODULES.SCIM,
    MODULES.AUDIT_LOGS,
    MODULES.METRICS,
    MODULES.PLUGINS,
    MODULES.CRM,
  ],
};

/**
 * Modules that must never appear in a bundle, whatever gets allowed later. Reaching
 * PERSONAL_ACCESS_TOKENS would let a token mint further tokens — a persistence mechanism that
 * survives revoking the original and launders a scoped token into an unscoped one. AUTH, SESSION
 * and PROFILE are the credential surface itself.
 *
 * Enforced by test, not by convention.
 */
export const PAT_NEVER_GRANTABLE: MODULES[] = [
  MODULES.PERSONAL_ACCESS_TOKENS,
  MODULES.AUTH,
  MODULES.SESSION,
  MODULES.PROFILE,
];

/**
 * Modules deliberately left out of every bundle, with the reason. Adding a module to MODULES
 * without placing it here or in a bundle fails the exhaustiveness test — so a new area of the API
 * forces a conscious decision instead of silently becoming a 403 nobody understands.
 */
export const PAT_UNASSIGNED_MODULES: MODULES[] = [
  ...PAT_NEVER_GRANTABLE, // credential surface — see above
  MODULES.AI, // builds apps, but its endpoints spend money on model calls
  MODULES.EXTERNAL_APIS, // authenticated by a separate instance-wide secret, not by a session
  MODULES.ONBOARDING, // signup/invite flow, meaningless for a machine client
  MODULES.METADATA, // instance metadata
  MODULES.FRONTEND_METRICS, // browser telemetry ingestion, not required by automation clients
  MODULES.ROOT, // health and version
];

/**
 * The live allowlist. Everything not reachable from these bundles is denied.
 *
 * Currently the exact set an app-building automation client needs and nothing more. MODULES.AI is
 * deliberately unassigned pending a decision — it builds apps, but its endpoints spend money on
 * model calls, so an app-scoped automation token should not reach it by default.
 */
export const PAT_ALLOWED_BUNDLES: PAT_BUNDLE[] = [PAT_BUNDLE.APPS, PAT_BUNDLE.DATA, PAT_BUNDLE.WORKSPACE_USERS];

/**
 * What an APP-PINNED session minted from a WORKSPACE token may reach — the browser-render check,
 * which boots the real player against one app and lints the DOM.
 *
 * Deliberately NOT a PAT_BUNDLE. A bundle is a capability group an automation client might be
 * granted, and the bundles partition the module space: no module appears in two, and none may
 * contain the credential surface. The viewer surface is a different axis — it is "what the player
 * needs in order to boot", so it necessarily overlaps the APPS bundle (APP, VERSION) and
 * necessarily includes the credential surface the SPA bootstraps through (AUTH, SESSION, PROFILE).
 * Modelling it as a bundle would either break those invariants or force the module space into a
 * partition that does not describe reality.
 *
 * The exchange between the two is that this list buys its wider reach with a hard narrowing the
 * workspace allowlist does not have: the session is pinned to ONE app, enforced per-request, and
 * is read-only. It cannot roam the workspace and it cannot write.
 *
 * MEASURED, not guessed. Derived from a real editor boot with PAT_SCOPE_AUDIT=true
 * (.agent-work/pat-viewer-audit.py): 23 requests, every one logged with the module its route
 * carries. Re-measure rather than extend by reasoning.
 *
 * The EDITOR, not the viewer: an AI-built app has not been released, and /applications/<id>
 * therefore renders "App URL Unavailable" without reaching the app at all. render_lint.app_url
 * already opens the editor route for this reason.
 */
export const PAT_APP_VIEWER_MODULES: MODULES[] = [
  // Observed on the measured boot.
  MODULES.AUTH, // /api/authorize — the SPA's boot call; without it the page redirects to login
  MODULES.APP,
  MODULES.APP_ENVIRONMENTS,
  MODULES.ORGANIZATION_CONSTANT,
  MODULES.DATA_QUERY,
  MODULES.GLOBAL_DATA_SOURCE, // the queries cannot run without their datasource
  MODULES.CUSTOM_STYLES, // changes how the app PAINTS — linting the DOM without it measures a lie

  /* Not observed on the measured boot, and required anyway: useAppData only fetches
     GET /v2/apps/:id/versions/:versionId when the URL carries ?version=, and the measured boot had
     none. A versioned boot 403s without this. Narrowed to the single read below; the route is
     /apps/:id/versions/:versionId, so the app pin covers it and the PUTs are already read-only. */
  MODULES.VERSION,

  /* Not observed, and deliberately kept: their absence is explained by the measured app's CONTENT,
     not by the player not needing them. That app has no custom theme and no file component, so
     these routes had nothing to fetch. An app that has them would 403 mid-render, and the render
     check would report a defect that does not exist. Confirm with an app that uses both, then trim
     whatever still does not appear.
     ORGANIZATION_VARIABLE was here too and is gone: no controller declares it, so no route can
     carry it and no request could ever have matched. */
  MODULES.ORGANIZATION_THEMES,
  MODULES.FILE,

  /* Deliberately NOT here, though the editor asked for them — the render check lints what the app
     painted, and none of these change that:
       AI              (getLlmPreference, getCreditsBalance) — the builder panel, and it spends money
       AppGit          (get_app_git_configs) — editor chrome
       DATA_QUERY_FOLDERS — sidebar organisation
     Also dropped from the first draft of this list, having never been called at all: SESSION and
     PROFILE. Leaving the credential surface out is worth more than the symmetry. */
];

/**
 * Feature-level narrowing WITHIN PAT_APP_VIEWER_MODULES. A module listed here is reachable only
 * through these features; a module absent from this map is reachable in full.
 *
 * This exists because module granularity is not safe for every module on the list. The session's
 * other two narrowings do not help: the app pin only fires on routes that carry /apps/<uuid>, and
 * read-only only bars writes. A module with a dangerous GET on a workspace-level path escapes both.
 *
 * ORGANIZATION_CONSTANT is the case that forced this. Granting the module reaches
 * GET /organization-constants/decrypted?type=Secret and /secrets — plaintext secrets for the whole
 * workspace, every environment. The same token WITHOUT an appId cannot touch that module at all
 * (it sits in WORKSPACE_ADMIN, which is not in PAT_ALLOWED_BUNDLES), so granting it here would mean
 * naming an app WIDENED the session. The player only ever needs the two by-app/by-environment reads.
 */
const PAT_APP_VIEWER_FEATURES: Partial<Record<MODULES, ReadonlySet<string>>> = {
  // authorize only. SWITCH_WORKSPACE is a GET on a workspace-level path and would let a session
  // pinned to one app mint its way into another workspace.
  [MODULES.AUTH]: new Set<string>([AUTH_FEATURE.AUTHORIZE]),

  // Reads by app and by environment. NEVER get_decrypted or get_secrets: a render check looks at
  // what the app painted and has no business decrypting anything.
  [MODULES.ORGANIZATION_CONSTANT]: new Set<string>([
    ORGANIZATION_CONSTANT_FEATURE.GET_FROM_APP,
    ORGANIZATION_CONSTANT_FEATURE.GET_FROM_ENVIRONMENT,
  ]),

  // The single app-definition fetch a versioned boot makes.
  [MODULES.VERSION]: new Set<string>([VERSION_FEATURE.GET_ONE]),
};

/**
 * The one module a viewer session must never reach, for the same reason the workspace allowlist
 * bars it: a session that can mint tokens can launder itself into an unscoped one and survive
 * revocation of the credential it came from. Enforced by test.
 */
export const PAT_APP_VIEWER_NEVER_GRANTABLE: MODULES[] = [MODULES.PERSONAL_ACCESS_TOKENS];

const APP_VIEWER_MODULES: ReadonlySet<MODULES> = new Set(PAT_APP_VIEWER_MODULES);

/**
 * Fails CLOSED, like patCanAccess: an unknown module is denied, and so is a route with no feature
 * metadata on a module that is feature-narrowed.
 */
export function patAppViewerCanAccess(module: MODULES | undefined, feature?: string): boolean {
  if (!module) return false;
  if (PAT_APP_VIEWER_NEVER_GRANTABLE.includes(module)) return false;
  if (!APP_VIEWER_MODULES.has(module)) return false;
  const allowedFeatures = PAT_APP_VIEWER_FEATURES[module];
  return !allowedFeatures || (!!feature && allowedFeatures.has(feature));
}

const ALLOWED_MODULES: ReadonlySet<MODULES> = new Set(
  PAT_ALLOWED_BUNDLES.flatMap((bundle) => PAT_BUNDLE_MODULES[bundle])
);

const PAT_ALLOWED_FEATURES: Partial<Record<MODULES, ReadonlySet<string>>> = {
  [MODULES.ORGANIZATION_USER]: new Set([
    ORGANIZATION_USER_FEATURE.VIEW_ALL_USERS,
    ORGANIZATION_USER_FEATURE.USER_INVITE,
    ORGANIZATION_USER_FEATURE.USER_UPDATE,
    ORGANIZATION_USER_FEATURE.USER_ARCHIVE,
    ORGANIZATION_USER_FEATURE.USER_UNARCHIVE,
  ]),
};

/** Which bundle a module belongs to, for the denial message. Undefined if unassigned. */
export function patBundleOf(module: MODULES): PAT_BUNDLE | undefined {
  return (Object.keys(PAT_BUNDLE_MODULES) as PAT_BUNDLE[]).find((b) => PAT_BUNDLE_MODULES[b].includes(module));
}

/**
 * Fails CLOSED: a route whose controller carries no @InitModule is denied rather than exempt, so a
 * new endpoint is locked down by default instead of silently escaping the allowlist.
 */
export function patCanAccess(module: MODULES | undefined, feature?: string): boolean {
  if (!module) return false;
  if (!ALLOWED_MODULES.has(module)) return false;
  const allowedFeatures = PAT_ALLOWED_FEATURES[module];
  return !allowedFeatures || (!!feature && allowedFeatures.has(feature));
}
