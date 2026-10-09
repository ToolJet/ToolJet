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
const builder = (userId: string, workspaceId = 'ws-sales'): Membership => ({
  userId,
  name: userId,
  email: `${userId}@acme.io`,
  userArchived: false,
  workspaceId,
  activeMember: true,
  canEdit: true,
});

const balance = (remainingMonthly: number, remainingAddon: number): GatewayBalance => ({
  balance: remainingMonthly + remainingAddon,
  remaining: { recurring: remainingMonthly, topup: remainingAddon, total: remainingMonthly + remainingAddon },
  expiry: { recurringExpiryDate: '2026-11-01T00:00:00.000Z', topupExpiryDate: '2027-08-02T00:00:00.000Z' },
  cycleStart: '2026-10-01T00:00:00.000Z',
});

/** @group ai */
describe('builder usage', () => {
  describe('joinUsageToPeople()', () => {
    describe('with a net refund', () => {
      it('should keep it on the row as negative spend', () => {
        const rows = joinUsageToPeople([{ userId: 'priya', monthly: -3, addon: 0 }], [builder('priya')], false);

        expect(rows).toEqual([expect.objectContaining({ kind: 'builder', userId: 'priya', monthly: -3, addon: 0 })]);
      });
    });
  });

  describe('poolTotals()', () => {
    it('should size the pool as remaining plus net spend this cycle', () => {
      const spend = [
        { userId: 'priya', monthly: 100.25, addon: 0 },
        { userId: null, monthly: -0.25, addon: 5 },
      ];

      expect(poolTotals(900, spend, 'monthly', '2026-11-01')).toEqual({
        total: 1000,
        remaining: 900,
        used: 100,
        endsAt: '2026-11-01',
      });
    });

    describe('with a fractional spend', () => {
      it('should never shrink the pool or its default (the gateway floors remaining)', () => {
        const monthly = poolTotals(19_999, [{ userId: 'priya', monthly: 0.26, addon: 0 }], 'monthly', null);
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
  });

  describe('resolveScopeLimits()', () => {
    it('should split the floored cycle-start pools among builders only', () => {
      const pool = (total: number) => ({ total, remaining: total, used: 0, endsAt: null });

      const r = resolveScopeLimits({
        pools: { monthly: pool(900.6), addon: pool(30) },
        memberships: [
          builder('amara'),
          builder('omar', 'ws-support'),
          { ...builder('end'), canEdit: false },
          { ...builder('gone'), userArchived: true },
        ],
        limits: newScopeLimits(),
      });

      expect([...r.byBuilder.keys()]).toEqual(['amara', 'omar']);
      expect(r.byBuilder.get('amara')).toEqual({ monthly: 450, addon: 15 });
    });
  });

  describe('toCreditsUsage()', () => {
    describe('with limits on', () => {
      it("should follow the builder's logical split by each workspace's share of spend", () => {
        // Pool: 8,000 monthly + 1,600 add-on (remaining 6,300 + 1,260 plus this cycle's spend), shared by 4 builders,
        //   so each builder's limit is 2,000 monthly + 400 add-on.
        // Priya spent 2,040 in total. The gateway billed 1,700 to monthly and 340 to add-on,
        //   but limits count monthly first: 2,000 monthly (her full share), then 40 add-on.
        // 75% of her spend was in Sales (1,530 of 2,040) and 25% in Support (510),
        //   so Sales shows 75% of each part (1,500 + 30) and Support 25% (500 + 10).
        const result = toCreditsUsage({
          limitsAvailable: true,
          balance: balance(6300, 1260),
          usage: {
            cycleStart: null,
            trackingSince: null,
            spend: [
              {
                userId: 'priya',
                monthly: 1700,
                addon: 340,
                byWorkspace: [
                  { organizationId: 'ws-sales', monthly: 1530, addon: 0 },
                  { organizationId: 'ws-support', monthly: 170, addon: 340 },
                ],
              },
            ],
          },
          memberships: [builder('priya'), builder('quinn'), builder('ravi'), builder('sara')],
          workspaces: null,
          limits: newScopeLimits(),
        });

        expect(result.rows[0]).toMatchObject({ userId: 'priya', monthly: 2000, addon: 40 });
        expect(result.rows[0].byWorkspace).toEqual([
          { organizationId: 'ws-sales', monthly: 1500, addon: 30 },
          { organizationId: 'ws-support', monthly: 500, addon: 10 },
        ]);
      });

      it('should sum exactly to the row with the rounding remainder on the largest share', () => {
        // Priya's custom limit is 1 monthly + 400 add-on.
        // She spent 7 in total, 1 in each of 7 workspaces.
        // Limits count monthly first: 1 monthly, then 6 add-on.
        // Each workspace gets a seventh of each part, rounded to cents: 0.14 monthly + 0.86 add-on.
        // The first workspace takes the rounding remainder (0.16 + 0.84), so the parts still sum to 1 and 6.
        const result = toCreditsUsage({
          limitsAvailable: true,
          balance: balance(900, 1000),
          usage: {
            cycleStart: null,
            trackingSince: null,
            spend: [
              {
                userId: 'priya',
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
          memberships: [builder('priya')],
          workspaces: null,
          limits: { ...newScopeLimits(), custom: new Map([['priya', { monthly: 1, addon: 400 }]]) },
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
  });

  describe('toMyCredits()', () => {
    describe('when monthly spend passes the monthly limit', () => {
      it('should count the excess as add-on and keep the overshoot visible', () => {
        // Pool: 1,000 monthly + 200 add-on, shared by 2 builders,
        //   so each builder's limit is 500 monthly + 100 add-on.
        // Priya spent 650, all billed to monthly.
        // Limits count monthly first: 500 monthly, then 150 add-on, which is 50 over her add-on limit.
        const r = toMyCredits({
          balance: balance(350, 200),
          usage: {
            cycleStart: '2026-10-01T00:00:00.000Z',
            trackingSince: null,
            spend: [{ userId: 'priya', monthly: 650, addon: 0 }],
          },
          memberships: [builder('priya'), builder('quinn')],
          limits: newScopeLimits(),
          userId: 'priya',
        });

        expect(r).toEqual({
          enabled: true,
          cycleStart: '2026-10-01T00:00:00.000Z',
          monthly: { used: 500, limit: 500, left: 0, renewsOn: '2026-11-01T00:00:00.000Z' },
          addon: { used: 150, limit: 100, left: 0, expiresOn: '2027-08-02T00:00:00.000Z' },
        });
      });
    });

    describe('with no add-on limit', () => {
      it('should keep all spend monthly, as in the usage table', () => {
        // Pool: 1,000 monthly and no add-on, shared by 2 builders,
        //   so each builder's limit is 500 monthly + 0 add-on.
        // Priya spent 600. With no add-on limit, all 600 stays monthly, 100 over her limit.
        const r = toMyCredits({
          balance: balance(400, 0),
          usage: {
            cycleStart: '2026-10-01T00:00:00.000Z',
            trackingSince: null,
            spend: [{ userId: 'priya', monthly: 600, addon: 0 }],
          },
          memberships: [builder('priya'), builder('quinn')],
          limits: newScopeLimits(),
          userId: 'priya',
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
});
