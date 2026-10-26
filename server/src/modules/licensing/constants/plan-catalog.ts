import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { LICENSE_TYPE } from './index';

// Lowest plan that unlocks each paid feature, per deployment. Drives the "lock + plan name"
// tag in the UI. Display only: access is still decided by the license terms, never by this file.
//
// Plan ids are the backend plan values (`plan` on /license/access), never shown to users.
// Note the naming trap: id 'basic' is the free tier (no paid license), shown as "Free";
// the paid "Basic" plan is 'basicplus'.

export type PlanId = 'basic' | 'basicplus' | 'pro' | 'team' | 'enterprise';
export type Deployment = 'cloud' | 'selfHosted';

// Gate keys are the flat /license/access feature keys (LicenseBase.features), except 'byok',
// which the frontend derives from aiPlan.
export const GATE_KEYS = [
  'gitSync',
  'gitSyncMultiBranch',
  'customThemes',
  'customStyling',
  'modulesEnabled',
  'whiteLabelling',
  'openid',
  'ldap',
  'saml',
  'customGroups',
  'auditLogs',
  'appPermissionPages',
  'appPermissionComponent',
  'appPermissionQuery',
  'multiEnvironment',
  'multiPlayerEdit',
  'comments',
  'automaticSsoLogin',
  'envConfigMapping',
  'customDomain',
  'mfa',
  'queryFolders',
  'appPagesHeaderAndLogoEnabled',
  'appPagesAddNavGroupEnabled',
  'canvasPageHeaderEnabled',
  'canvasPageFooterEnabled',
  'promote',
  'release',
  'byok',
] as const;
export type GateKey = (typeof GATE_KEYS)[number];

export interface PlanCatalogPlan {
  id: PlanId;
  label: string;
}

// `null` means the deployment does not offer the feature at all, so no tag is shown.
export interface PlanCatalogSlice {
  plans: PlanCatalogPlan[]; // cheapest first: array index is the rank
  gates: Partial<Record<GateKey, PlanId | null>>;
}

interface DeploymentCatalog extends PlanCatalogSlice {
  gates: Record<GateKey, PlanId | null>;
}

// Cloud values mirror the *_PLAN_TERMS_CLOUD presets and are enforced by
// test/modules/licensing/unit/plan-catalog-drift.spec.ts. Self-hosted values follow the
// public pricing page; self-hosted licenses are issued per customer, so no test enforces them.
export const PLAN_CATALOG: Readonly<Record<Deployment, DeploymentCatalog>> = {
  cloud: {
    plans: [
      { id: 'basic', label: 'Free' },
      { id: 'basicplus', label: 'Basic' },
      { id: 'pro', label: 'Pro' },
      { id: 'team', label: 'Team' },
      { id: 'enterprise', label: 'Enterprise' },
    ],
    gates: {
      gitSync: 'team',
      gitSyncMultiBranch: 'team',
      customThemes: 'team',
      customStyling: 'pro',
      modulesEnabled: 'team',
      whiteLabelling: 'pro',
      openid: 'team',
      ldap: 'team',
      saml: 'team',
      customGroups: 'team',
      auditLogs: 'team',
      appPermissionPages: 'enterprise',
      appPermissionComponent: 'enterprise',
      appPermissionQuery: 'enterprise',
      multiEnvironment: 'team',
      multiPlayerEdit: 'team',
      comments: 'team',
      automaticSsoLogin: 'enterprise',
      envConfigMapping: 'enterprise',
      customDomain: 'team',
      mfa: 'enterprise',
      queryFolders: 'enterprise',
      appPagesHeaderAndLogoEnabled: 'team',
      appPagesAddNavGroupEnabled: 'team',
      canvasPageHeaderEnabled: 'team',
      canvasPageFooterEnabled: 'team',
      promote: 'enterprise',
      release: 'enterprise',
      byok: null,
    },
  },
  selfHosted: {
    plans: [
      { id: 'basic', label: 'Free' },
      { id: 'team', label: 'Team' },
      { id: 'enterprise', label: 'Enterprise' },
    ],
    gates: {
      gitSync: 'team',
      gitSyncMultiBranch: 'enterprise',
      customThemes: 'team',
      customStyling: 'team',
      modulesEnabled: 'team',
      whiteLabelling: 'team',
      openid: 'team',
      ldap: 'team',
      saml: 'team',
      customGroups: 'team',
      auditLogs: 'team',
      appPermissionPages: 'enterprise',
      appPermissionComponent: 'enterprise',
      appPermissionQuery: 'enterprise',
      multiEnvironment: 'team',
      multiPlayerEdit: 'team',
      comments: 'team',
      automaticSsoLogin: 'enterprise',
      envConfigMapping: 'enterprise',
      customDomain: 'team',
      mfa: 'enterprise',
      queryFolders: 'enterprise',
      appPagesHeaderAndLogoEnabled: 'team',
      appPagesAddNavGroupEnabled: 'team',
      canvasPageHeaderEnabled: 'team',
      canvasPageFooterEnabled: 'team',
      promote: 'enterprise',
      release: 'enterprise',
      byok: 'enterprise',
    },
  },
};

// CE shows no plan tags, so it gets an empty catalog.
export const EMPTY_PLAN_CATALOG: PlanCatalogSlice = { plans: [], gates: {} };

// Legacy plan values that map to a current plan. 'starter' is no longer sold, but checkout and
// renewals still accept it and its terms are identical to 'basicplus'.
const PLAN_ALIASES: ReadonlyMap<string, PlanId> = new Map([['starter', 'basicplus']]);

export function selectPlanCatalog(edition: string): PlanCatalogSlice {
  switch (edition) {
    case TOOLJET_EDITIONS.Cloud:
      return PLAN_CATALOG.cloud;
    case TOOLJET_EDITIONS.EE:
      return PLAN_CATALOG.selfHosted;
    default:
      return EMPTY_PLAN_CATALOG;
  }
}

// The plan the workspace (cloud) or instance (self-hosted) is on, as a catalog plan id.
// Returns null when the plan can't be placed on the ladder (a trial without a plan, or a
// hand-edited license with an unknown plan name); the UI then shows a generic "Upgrade".
export function resolvePlanTier(
  plan: string | undefined,
  licenseType: string | undefined,
  catalog: PlanCatalogSlice
): PlanId | null {
  const ladder = new Set<string>(catalog.plans.map((p) => p.id));
  const onLadder = (id: string | undefined): PlanId | null => (id && ladder.has(id) ? (id as PlanId) : null);

  if (licenseType === LICENSE_TYPE.ENTERPRISE) return onLadder('enterprise');

  const fromPlan = onLadder(plan ? (PLAN_ALIASES.get(plan) ?? plan) : undefined);
  if (fromPlan) return fromPlan;

  // No, invalid or expired license.
  if (licenseType === LICENSE_TYPE.BASIC) return onLadder('basic');

  return null;
}
