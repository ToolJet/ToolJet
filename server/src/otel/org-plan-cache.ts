import { getConnectionInstance } from '@helpers/database.helper';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';

/**
 * Cloud-only: tracks which orgs are on an active, non-expired Teams plan.
 * EE is self-hosted — every org streams everything, no gating needed.
 * CE: OTEL is already gated upstream by isOtelEnabled.
 *
 * Paid = organization_subscriptions.plan = 'team' AND status = 'active'
 *      + organization_license.license_type = 'business' AND expiry_with_grace_period > NOW()
 */

const paidOrgIds = new Set<string>();
let ready = false;

function isCloud(): boolean {
  return getTooljetEdition() === TOOLJET_EDITIONS.Cloud;
}

async function refresh(): Promise<void> {
  try {
    const db = getConnectionInstance();
    const rows = await db.query(`
      SELECT DISTINCT ol.organization_id::text
      FROM organization_license ol
      JOIN organization_subscriptions os ON os.organization_id = ol.organization_id
      WHERE ol.license_type = 'business'
        AND ol.expiry_with_grace_period > NOW()
        AND os.status = 'active'
        AND os.plan = 'team'
    `);
    paidOrgIds.clear();
    rows.forEach((r: { organization_id: string }) => paidOrgIds.add(r.organization_id));
    ready = true;
  } catch (err) {
    // Never crash OTEL infra — leave previous cache intact on DB error
    console.error('[OTEL] org-plan-cache refresh failed:', err);
  }
}

export function initializePlanCache(): void {
  if (!isCloud()) return;
  // DB may not be ready immediately on first call — refresh() guards via try/catch
  refresh();
  // ponytail: 5-min TTL, licenses don't change by the second
  setInterval(refresh, 5 * 60 * 1000);
}

/**
 * Returns the workspace label for OTEL metric dimensions.
 * Cloud Teams orgs  → real organization_id
 * Cloud others      → 'free_tier' (bucketed)
 * EE / CE           → organization_id unchanged
 */
export function getWorkspaceLabel(organizationId: string): string {
  if (!isCloud()) return organizationId;
  if (!ready) return organizationId; // fail-open while cache warms on startup
  return paidOrgIds.has(organizationId) ? organizationId : 'free_tier';
}
