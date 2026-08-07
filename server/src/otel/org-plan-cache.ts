import { getConnectionInstance } from '@helpers/database.helper';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';

/**
 * Cloud-only: tracks which orgs are on an active, non-expired Teams plan.
 * Non-paying orgs collapse into a single `free_tier` label so Prometheus
 * cardinality stays bounded as signups grow.
 *
 * EE is self-hosted — one instance, one customer, no bucketing needed.
 * CE never reaches here (OTEL gated upstream by ENABLE_OTEL).
 *
 * Paid = organization_license.license_type = 'business' AND not expired
 *      + organization_subscriptions.status = 'active' AND plan = 'team'
 */

export const FREE_TIER_LABEL = 'free_tier';

const PAID_ORG_QUERY = `
  SELECT DISTINCT ol.organization_id::text AS organization_id
  FROM organization_license ol
  JOIN organization_subscriptions os ON os.organization_id = ol.organization_id
  WHERE ol.license_type = 'business'
    AND ol.expiry_with_grace_period > NOW()
    AND os.status = 'active'
    AND os.plan = 'team'
`;

// Licenses don't change by the second
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
// DB may not be up when OTEL starts
const FIRST_REFRESH_DELAY_MS = 30 * 1000;

const paidOrgIds = new Set<string>();
let ready = false;
let refreshInterval: NodeJS.Timeout | null = null;
let firstRefreshTimeout: NodeJS.Timeout | null = null;

const isCloud = (): boolean => getTooljetEdition() === TOOLJET_EDITIONS.Cloud;

const refresh = async (): Promise<void> => {
  try {
    const rows: { organization_id: string }[] = await getConnectionInstance().query(PAID_ORG_QUERY);
    paidOrgIds.clear();
    for (const row of rows) paidOrgIds.add(row.organization_id);
    ready = true;
  } catch (error) {
    // Observability never breaks the app — keep the previous cache on DB error
    console.error('[OTEL] org-plan-cache refresh failed:', error);
  }
};

export const initializePlanCache = (): void => {
  if (process.env.ENABLE_OTEL !== 'true') return;
  if (!isCloud()) return;
  if (refreshInterval) return;

  firstRefreshTimeout = setTimeout(() => void refresh(), FIRST_REFRESH_DELAY_MS);
  refreshInterval = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
  firstRefreshTimeout.unref?.();
  refreshInterval.unref?.();
};

export const shutdownPlanCache = (): void => {
  if (firstRefreshTimeout) clearTimeout(firstRefreshTimeout);
  if (refreshInterval) clearInterval(refreshInterval);
  firstRefreshTimeout = null;
  refreshInterval = null;
  paidOrgIds.clear();
  ready = false;
};

const isGated = (organizationId: string): boolean => {
  if (!isCloud()) return false;
  // Fail open while the cache warms — mislabelling a paying org is worse than a brief cardinality blip
  if (!ready) return false;
  return !paidOrgIds.has(organizationId);
};

/**
 * Workspace id label for OTEL metric dimensions.
 * Cloud paying org → real id; Cloud free org → 'free_tier'; EE/CE → unchanged.
 */
export const getWorkspaceLabel = (organizationId: string): string =>
  isGated(organizationId) ? FREE_TIER_LABEL : organizationId;

/**
 * Workspace name label. Must follow the exact same policy as getWorkspaceLabel —
 * a real name next to a bucketed id would re-explode cardinality and de-anonymise the bucket.
 */
export const getWorkspaceNameLabel = (organizationId: string, organizationName: string): string =>
  isGated(organizationId) ? FREE_TIER_LABEL : organizationName;
