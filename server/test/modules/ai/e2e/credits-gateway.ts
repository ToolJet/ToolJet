import { INestApplication } from '@nestjs/common';
import { buildTestSession, getDefaultDataSource, ENTERPRISE_TEST_TERMS } from 'test-helper';
import LicenseBase from '@modules/licensing/configs/LicenseBase';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { BASIC_PLAN_TERMS } from '@modules/licensing/constants/PlanTerms';
import { LICENSE_TYPE } from '@modules/licensing/constants';
import { Terms } from '@modules/licensing/interfaces/terms';
import { User } from '@entities/user.entity';

export const GATEWAY = 'http://gateway.test';
export const CYCLE_START = '2026-10-01T00:00:00.000Z';
export const RENEWS = '2026-11-01T00:00:00.000Z';

/**
 * Fakes the AI gateway at its HTTP boundary; other URLs reach the real fetch. A route may be a function, called
 * per request (a never-settling promise = a hung gateway; a throw = a network error). Unknown paths answer 404.
 */
export function stubGateway(routes: Record<string, unknown>) {
  const realFetch = global.fetch;
  return jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (!url.startsWith(GATEWAY)) return realFetch(input, init);
    const path = url.slice(GATEWAY.length);
    if (!(path in routes)) return new Response(JSON.stringify({ message: 'not stubbed' }), { status: 404 });
    const route = routes[path];
    const body = typeof route === 'function' ? await route() : route;
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  });
}

const wallet = (recurring: number, topup = 0) => ({ recurring, topup, total: recurring + topup });

/**
 * Balance and usage answers for one owner (`/api/ai/organizations/:id` or `/api/ai/selfhost-customers/:id`).
 * `spend` is monthly spend per user id; the balance is the pool minus all spend. `plan` = the plan sizes the
 * gateway reports, which is how a plan change or add-on expiry shows; without it nothing records plan sizes.
 */
export function gatewayFor(
  owner: string,
  pool: { monthly: number; addon: number },
  spend: Record<string, number> = {},
  more: {
    addonSpend?: Record<string, number>;
    plan?: { monthly: number; addon: number };
    cycleStart?: string;
    addonEndsAt?: string | null;
  } = {}
) {
  const { addonSpend = {}, plan, cycleStart = CYCLE_START, addonEndsAt = null } = more;
  const userIds = [...new Set([...Object.keys(spend), ...Object.keys(addonSpend)])];
  const users = userIds.map((userId) => ({ userId, ...wallet(spend[userId] ?? 0, addonSpend[userId] ?? 0) }));
  const used = wallet(
    users.reduce((acc, u) => acc + u.recurring, 0),
    users.reduce((acc, u) => acc + u.topup, 0)
  );
  const remaining = wallet(pool.monthly - used.recurring, pool.addon - used.topup);
  const usage = { cycleStart, trackingSince: null, users, unattributed: wallet(0), pool: used };
  return {
    [`${owner}/balance`]: {
      balance: remaining.total,
      ...(plan && { plan: wallet(plan.monthly, plan.addon) }),
      remaining,
      expiry: { recurringExpiryDate: RENEWS, topupExpiryDate: addonEndsAt },
      cycleStart,
    },
    [`${owner}/usage`]: usage,
    [`${owner}/usage?groupBy=organization`]: { ...usage, users: users.map((u) => ({ ...u, byOrganization: [] })) },
  } as Record<string, unknown>;
}

export const sessionFor = async (user: User, organizationId: string) =>
  (await buildTestSession(user, organizationId)).tokenCookie;

/** The test licence with only the type changed: Team (business) has no per-builder limits. */
export const TEAM_TERMS: Partial<Terms> = { ...ENTERPRISE_TEST_TERMS, type: LICENSE_TYPE.BUSINESS };

/** Self-hosted reads the gateway key and customer id from the licence. */
export const SELF_HOSTED_CUSTOMER = 'customer-1';
export const SELF_HOSTED_TERMS: Partial<Terms> = {
  ...ENTERPRISE_TEST_TERMS,
  ai: { plan: 'credits', apiKey: 'selfhost-key' },
  meta: { customerId: SELF_HOSTED_CUSTOMER },
} as Partial<Terms>;

/** Swaps the app's licence for one built from `terms`; call the returned function to put the old one back. */
export function useLicence(app: INestApplication, terms: Partial<Terms>): () => void {
  const lts = app.get(LicenseTermsService) as unknown as { _licenseInstance: LicenseBase };
  const previous = lts._licenseInstance;
  const expiry = new Date(Date.now() + 86_400_000);
  lts._licenseInstance = new (LicenseBase as unknown as new (...args: unknown[]) => LicenseBase)(
    BASIC_PLAN_TERMS,
    terms,
    new Date(),
    new Date(),
    expiry
  );
  return () => {
    lts._licenseInstance = previous;
  };
}

/** Rows committed outside the suite transaction (real-transaction tests) are deleted by hand. */
export async function dropSeed(organizationId: string, userIds: string[]) {
  const db = getDefaultDataSource();
  for (const table of ['ai_active_runs', 'ai_credit_limits', 'audit_logs', 'data_sources']) {
    await db.query(`DELETE FROM ${table} WHERE organization_id = $1`, [organizationId]);
  }
  await db.query('DELETE FROM ai_credit_limits WHERE user_id = ANY($1)', [userIds]);
  await db.query('DELETE FROM organizations WHERE id = $1', [organizationId]);
  await db.query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
}

/** Audit entries are written by an async listener: waits for `count`, then a moment more so extras show too. */
export async function auditRows(organizationId: string, actionType: string, count: number) {
  const read = () =>
    getDefaultDataSource().query(
      `SELECT user_id AS "userId", metadata FROM audit_logs
        WHERE organization_id = $1 AND action_type = $2 ORDER BY created_at`,
      [organizationId, actionType]
    );
  for (let i = 0; i < 50 && (await read()).length < count; i++) await new Promise((r) => setTimeout(r, 100));
  await new Promise((r) => setTimeout(r, 300));
  return read();
}
