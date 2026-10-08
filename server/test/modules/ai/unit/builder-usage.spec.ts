import {
  GatewayBalance,
  Membership,
  joinUsageToPeople,
  poolTotals,
  resolveScopeLimits,
  toCreditsUsage,
  toMyCredits,
} from '@ee/ai/services/builder-usage.service';
import { newScopeLimits } from '@ee/ai/services/credit-limits';

/** A builder who can edit one workspace. */
const builder = (userId: string, workspaceId = 'ws-a'): Membership => ({
  userId,
  name: userId,
  email: `${userId}@acme.io`,
  userArchived: false,
  workspaceId,
  activeMember: true,
  canEdit: true,
});

const balance = (remainingMonthly: number, remainingAddon: number): GatewayBalance => ({
  remaining: { recurring: remainingMonthly, topup: remainingAddon, total: remainingMonthly + remainingAddon },
  expiry: { recurringExpiryDate: '2026-11-01T00:00:00.000Z', topupExpiryDate: '2027-08-02T00:00:00.000Z' },
  cycleStart: '2026-10-01T00:00:00.000Z',
});

/** @group ai */
describe('builder usage calculations', () => {
  it('a net refund stays on the row as negative spend', () => {
    const rows = joinUsageToPeople([{ userId: 'u1', monthly: -3, addon: 0 }], [builder('u1')], false);

    expect(rows).toEqual([expect.objectContaining({ kind: 'builder', userId: 'u1', monthly: -3, addon: 0 })]);
  });

  describe('poolTotals', () => {
    it('sizes the pool as remaining plus net spend this cycle', () => {
      const spend = [
        { userId: 'a', monthly: 100.25, addon: 0 },
        { userId: null, monthly: -0.25, addon: 5 },
      ];

      expect(poolTotals(900, spend, 'monthly', '2026-11-01')).toEqual({
        total: 1000,
        remaining: 900,
        used: 100,
        endsAt: '2026-11-01',
      });
    });

    it('a fractional spend never shrinks the pool or its default (the gateway floors remaining)', () => {
      const monthly = poolTotals(19_999, [{ userId: 'a', monthly: 0.26, addon: 0 }], 'monthly', null);
      const builders = Array.from({ length: 10 }, (_, i) => builder(`b${i}`));

      const r = resolveScopeLimits({
        pools: { monthly, addon: poolTotals(0, [], 'addon', null) },
        memberships: builders,
        limits: newScopeLimits(),
      });

      expect(monthly.total).toBe(20_000);
      expect(r.byBuilder.get('b0')).toEqual({ monthly: 2000, addon: 0 });
    });
  });

  it('resolveScopeLimits splits the floored cycle-start pools among builders only', () => {
    const pool = (total: number) => ({ total, remaining: total, used: 0, endsAt: null });

    const r = resolveScopeLimits({
      pools: { monthly: pool(900.6), addon: pool(30) },
      memberships: [
        builder('b1'),
        builder('b2', 'ws-b'),
        { ...builder('end'), canEdit: false },
        { ...builder('gone'), userArchived: true },
      ],
      limits: newScopeLimits(),
    });

    expect([...r.byBuilder.keys()]).toEqual(['b1', 'b2']);
    expect(r.byBuilder.get('b1')).toEqual({ monthly: 450, addon: 15 });
  });

  describe('toCreditsUsage: the workspace breakdown with limits on', () => {
    it("follows the builder's logical split by each workspace's share of spend", () => {
      // 4 builders on 8,000 + 1,600: limit 2,000 + 400. u1 spent 1,700 + 340 = 2,040: ws-a 1,530 (75%), ws-b 510 (25%).
      const result = toCreditsUsage({
        limitsAvailable: true,
        balance: balance(6300, 1260),
        usage: {
          cycleStart: null,
          trackingSince: null,
          spend: [
            {
              userId: 'u1',
              monthly: 1700,
              addon: 340,
              byWorkspace: [
                { organizationId: 'ws-a', monthly: 1530, addon: 0 },
                { organizationId: 'ws-b', monthly: 170, addon: 340 },
              ],
            },
          ],
        },
        memberships: [builder('u1'), builder('u2'), builder('u3'), builder('u4')],
        workspaces: null,
        limits: newScopeLimits(),
      });

      expect(result.rows[0]).toMatchObject({ userId: 'u1', monthly: 2000, addon: 40 });
      expect(result.rows[0].byWorkspace).toEqual([
        { organizationId: 'ws-a', monthly: 1500, addon: 30 },
        { organizationId: 'ws-b', monthly: 500, addon: 10 },
      ]);
    });

    it('sums exactly to the row: the rounding remainder goes on the largest share', () => {
      // u1's custom limit is 1 + 400: 7 spent is 1 monthly + 6 add-on, split over 7 equal workspaces.
      const result = toCreditsUsage({
        limitsAvailable: true,
        balance: balance(900, 1000),
        usage: {
          cycleStart: null,
          trackingSince: null,
          spend: [
            {
              userId: 'u1',
              monthly: 7,
              addon: 0,
              byWorkspace: ['ws-1', 'ws-2', 'ws-3', 'ws-4', 'ws-5', 'ws-6', 'ws-7'].map((organizationId) => ({
                organizationId,
                monthly: 1,
                addon: 0,
              })),
            },
          ],
        },
        memberships: [builder('u1')],
        workspaces: null,
        limits: { ...newScopeLimits(), custom: new Map([['u1', { monthly: 1, addon: 400 }]]) },
      });

      expect(result.rows[0]).toMatchObject({ monthly: 1, addon: 6 });
      expect(result.rows[0].byWorkspace).toEqual([
        { organizationId: 'ws-1', monthly: 0.16, addon: 0.84 },
        { organizationId: 'ws-2', monthly: 0.14, addon: 0.86 },
        { organizationId: 'ws-3', monthly: 0.14, addon: 0.86 },
        { organizationId: 'ws-4', monthly: 0.14, addon: 0.86 },
        { organizationId: 'ws-5', monthly: 0.14, addon: 0.86 },
        { organizationId: 'ws-6', monthly: 0.14, addon: 0.86 },
        { organizationId: 'ws-7', monthly: 0.14, addon: 0.86 },
      ]);
    });
  });

  describe("toMyCredits: a builder's own numbers", () => {
    it('monthly spend past the monthly limit counts as add-on; the overshoot stays visible', () => {
      // 2 builders on 1,000 + 200: limit 500 + 100. a spent 650.
      const r = toMyCredits({
        balance: balance(350, 200),
        usage: {
          cycleStart: '2026-10-01T00:00:00.000Z',
          trackingSince: null,
          spend: [{ userId: 'a', monthly: 650, addon: 0 }],
        },
        memberships: [builder('a'), builder('b')],
        limits: newScopeLimits(),
        userId: 'a',
      });

      expect(r).toEqual({
        enabled: true,
        cycleStart: '2026-10-01T00:00:00.000Z',
        monthly: { used: 500, limit: 500, left: 0, renewsOn: '2026-11-01T00:00:00.000Z' },
        addon: { used: 150, limit: 100, left: 0, expiresOn: '2027-08-02T00:00:00.000Z' },
      });
    });

    it('no add-on limit: all spend stays monthly, as in the usage table', () => {
      // 2 builders on 1,000 + 0: limit 500 + 0. a spent 600.
      const r = toMyCredits({
        balance: balance(400, 0),
        usage: {
          cycleStart: '2026-10-01T00:00:00.000Z',
          trackingSince: null,
          spend: [{ userId: 'a', monthly: 600, addon: 0 }],
        },
        memberships: [builder('a'), builder('b')],
        limits: newScopeLimits(),
        userId: 'a',
      });

      expect(r).toEqual({
        enabled: true,
        cycleStart: '2026-10-01T00:00:00.000Z',
        monthly: { used: 600, limit: 500, left: 0, renewsOn: '2026-11-01T00:00:00.000Z' },
        addon: { used: 0, limit: 0, left: 0, expiresOn: '2027-08-02T00:00:00.000Z' },
      });
    });
  });
});
