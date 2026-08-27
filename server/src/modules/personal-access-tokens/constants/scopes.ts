import { MODULES } from '@modules/app/constants/modules';

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
 * This does NOT apply to the app-scoped embed flow (scope='app'), which runs a whole app viewer
 * and legitimately needs far more than an automation client.
 */
export enum PAT_BUNDLE {
  APPS = 'apps',
  DATA = 'data',
  WORKFLOWS = 'workflows',
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
  [PAT_BUNDLE.WORKSPACE_ADMIN]: [
    MODULES.ORGANIZATIONS,
    MODULES.ORGANIZATION_USER,
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
  MODULES.ROOT, // health and version
];

/**
 * The live allowlist. Everything not reachable from these bundles is denied.
 *
 * Currently the exact set an app-building automation client needs and nothing more. MODULES.AI is
 * deliberately unassigned pending a decision — it builds apps, but its endpoints spend money on
 * model calls, so an app-scoped automation token should not reach it by default.
 */
export const PAT_ALLOWED_BUNDLES: PAT_BUNDLE[] = [PAT_BUNDLE.APPS, PAT_BUNDLE.DATA];

const ALLOWED_MODULES: ReadonlySet<MODULES> = new Set(
  PAT_ALLOWED_BUNDLES.flatMap((bundle) => PAT_BUNDLE_MODULES[bundle])
);

/** Which bundle a module belongs to, for the denial message. Undefined if unassigned. */
export function patBundleOf(module: MODULES): PAT_BUNDLE | undefined {
  return (Object.keys(PAT_BUNDLE_MODULES) as PAT_BUNDLE[]).find((b) => PAT_BUNDLE_MODULES[b].includes(module));
}

/**
 * Fails CLOSED: a route whose controller carries no @InitModule is denied rather than exempt, so a
 * new endpoint is locked down by default instead of silently escaping the allowlist.
 */
export function patCanAccess(module: MODULES | undefined): boolean {
  if (!module) return false;
  return ALLOWED_MODULES.has(module);
}
