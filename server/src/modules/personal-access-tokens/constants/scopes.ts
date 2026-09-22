import { FEATURE_KEY as GROUP_FEATURE } from '@modules/group-permissions/constants';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY as ORGANIZATION_USER_FEATURE } from '@modules/organization-users/constants';
import { FEATURE_KEY as AUTH_FEATURE } from '@modules/auth/constants';
import { FEATURE_KEY as ORGANIZATION_CONSTANT_FEATURE } from '@modules/organization-constants/constants';
import { FEATURE_KEY as VERSION_FEATURE } from '@modules/versions/constants';
import { FEATURE_KEY as PLUGIN_FEATURE } from '@modules/plugins/constants';

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
 * Applies to workspace tokens without an appId only; the other session kinds are described in this
 * module's AGENTS.md.
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
  [PAT_BUNDLE.WORKSPACE_USERS]: [MODULES.ORGANIZATION_USER, MODULES.GROUP_PERMISSIONS],
  [PAT_BUNDLE.WORKSPACE_ADMIN]: [
    MODULES.ORGANIZATIONS,
    MODULES.USER,
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
 * Supports app-building and workflow automation clients. MODULES.AI is
 * deliberately unassigned pending a decision — it builds apps, but its endpoints spend money on
 * model calls, so a workspace automation token should not reach it by default.
 */
export const PAT_ALLOWED_BUNDLES: PAT_BUNDLE[] = [
  PAT_BUNDLE.APPS,
  PAT_BUNDLE.DATA,
  PAT_BUNDLE.WORKFLOWS,
  PAT_BUNDLE.WORKSPACE_USERS,
];

/**
 * What an APP-PINNED session minted from a WORKSPACE token may reach — the browser-render check,
 * which boots the real player against one app and lints the DOM.
 *
 * MEASURED from a real editor boot with PAT_SCOPE_AUDIT=true, not guessed. Re-measure rather than
 * extend by reasoning.
 *
 * The EDITOR, not the viewer: an AI-built app has not been released, so /applications/<id> renders
 * "App URL Unavailable" without reaching the app at all.
 */
export const PAT_APP_VIEWER_MODULES: MODULES[] = [
  MODULES.AUTH,
  MODULES.APP,
  MODULES.APP_ENVIRONMENTS,
  MODULES.ORGANIZATION_CONSTANT,
  MODULES.DATA_QUERY,
  MODULES.GLOBAL_DATA_SOURCE,
  MODULES.CUSTOM_STYLES, // changes how the app PAINTS — linting the DOM without it measures a lie

  // ?version= boots hit GET versions/:id; not on every boot
  MODULES.VERSION,

  // Not observed: the measured app has no custom theme and no file component. An app that has them
  // would 403 mid-render.
  MODULES.ORGANIZATION_THEMES,
  MODULES.FILE,
];

/**
 * Feature-level narrowing WITHIN PAT_APP_VIEWER_MODULES. A module listed here is reachable only
 * through these features; a module absent from this map is reachable in full.
 *
 * Module granularity is not safe for every module on the list: the app pin only fires on routes
 * that carry an app, and read-only only bars writes, so a dangerous GET on a workspace-level path
 * escapes both.
 */
export const PAT_APP_VIEWER_FEATURES: Partial<Record<MODULES, ReadonlySet<string>>> = {
  [MODULES.AUTH]: new Set<string>([AUTH_FEATURE.AUTHORIZE]),
  [MODULES.ORGANIZATION_CONSTANT]: new Set<string>([
    ORGANIZATION_CONSTANT_FEATURE.GET_FROM_APP,
    ORGANIZATION_CONSTANT_FEATURE.GET_FROM_ENVIRONMENT,
  ]),
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
  [MODULES.GROUP_PERMISSIONS]: new Set([
    GROUP_FEATURE.GET_ALL,
    GROUP_FEATURE.GET_ONE,
    GROUP_FEATURE.GET_ALL_GROUP_USER,
    GROUP_FEATURE.CREATE,
    GROUP_FEATURE.UPDATE,
    GROUP_FEATURE.DELETE,
    GROUP_FEATURE.DELETE_GROUP_USER,
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
  ]),
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
  // Installed API specs are read-only datasource metadata. Keep plugin administration in its
  // instance-admin bundle while allowing data clients to discover valid query contracts.
  if (module === MODULES.PLUGINS && feature === PLUGIN_FEATURE.GET_SPEC) {
    return PAT_ALLOWED_BUNDLES.includes(PAT_BUNDLE.DATA);
  }
  if (!ALLOWED_MODULES.has(module)) return false;
  const allowedFeatures = PAT_ALLOWED_FEATURES[module];
  return !allowedFeatures || (!!feature && allowedFeatures.has(feature));
}
