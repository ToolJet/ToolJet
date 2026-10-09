import { INestApplication } from '@nestjs/common';
import { buildTestSession } from './api';
import { getDefaultDataSource, ENTERPRISE_TEST_TERMS } from './setup';
import LicenseBase from '@modules/licensing/configs/LicenseBase';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { BASIC_PLAN_TERMS } from '@modules/licensing/constants/PlanTerms';
import { LICENSE_TYPE } from '@modules/licensing/constants';
import { Terms } from '@modules/licensing/interfaces/terms';
import { User } from '@entities/user.entity';
import type { GatewayBalance, GatewayUsage } from '@ee/ai/services/builder-usage.service';

export const GATEWAY = 'http://gateway.test';
export const CYCLE_START = '2026-10-01T00:00:00.000Z';
export const RENEWS = '2026-11-01T00:00:00.000Z';

/**
 * Fakes the AI gateway at its HTTP boundary; other URLs reach the real fetch. A route may be a function, called
 * per request (a never-settling promise = a hung gateway; a throw = a network error). Unknown paths answer 404.
 */
type GatewayResponse = GatewayBalance | GatewayUsage;
export type GatewayRoute = GatewayResponse | (() => Promise<GatewayResponse>);

export function stubGateway(routes: Record<string, GatewayRoute>) {
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

type Credits = { monthly: number; addon: number };

// The gateway's names: recurring = monthly pool, topup = add-on pool.
const gatewayCredits = (monthly: number, addon = 0) => ({ recurring: monthly, topup: addon, total: monthly + addon });
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/**
 * What the gateway reports about one wallet: its balance and its usage per builder. Pass the result to
 * `stubGateway`. The balance is the pool minus everything spent.
 *
 *   stubGateway(gatewayWallet({
 *     owner: ws.owner,                          // `/api/ai/organizations/:id` or `/api/ai/selfhost-customers/:id`
 *     pool: { monthly: 1000, addon: 100 },      // credits the wallet started the cycle with
 *     monthlySpent: { [priya.id]: 234 },        // spent this cycle, per builder
 *     addonSpent: { [priya.id]: 10 },
 *     plan: { monthly: 1000, addon: 100 },      // plan sizes; set it to show a plan change or add-on expiry
 *   }))
 */
export function gatewayWallet({
  owner,
  pool,
  monthlySpent = {},
  addonSpent = {},
  plan,
  cycleStart = CYCLE_START,
  addonEndsAt = null,
}: {
  owner: string;
  pool: Credits;
  monthlySpent?: Record<string, number>;
  addonSpent?: Record<string, number>;
  plan?: Credits;
  cycleStart?: string;
  addonEndsAt?: string | null;
}): Record<string, GatewayResponse> {
  const builderIds = [...new Set([...Object.keys(monthlySpent), ...Object.keys(addonSpent)])];
  const users = builderIds.map((userId) => ({
    userId,
    ...gatewayCredits(monthlySpent[userId] ?? 0, addonSpent[userId] ?? 0),
  }));
  const spent = gatewayCredits(sum(users.map((u) => u.recurring)), sum(users.map((u) => u.topup)));
  const remaining = gatewayCredits(pool.monthly - spent.recurring, pool.addon - spent.topup);
  const usage = { cycleStart, trackingSince: null, users, unattributed: gatewayCredits(0), pool: spent };
  return {
    [`${owner}/balance`]: {
      balance: remaining.total,
      ...(plan && { plan: gatewayCredits(plan.monthly, plan.addon) }),
      remaining,
      expiry: { recurringExpiryDate: RENEWS, topupExpiryDate: addonEndsAt },
      cycleStart,
    },
    [`${owner}/usage`]: usage,
    [`${owner}/usage?groupBy=organization`]: { ...usage, users: users.map((u) => ({ ...u, byOrganization: [] })) },
  };
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
