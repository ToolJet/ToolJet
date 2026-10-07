import {
  adjustToPool,
  noLimits,
  poolChange,
  poolsAdjustedEvent,
  sameSeen,
  ScopeLimits,
  SeenPools,
  seenPools,
} from '@ee/ai/services/credit-limits';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `b${i}`);

const seen = (monthly: number, addon: number, addonEndsAt: string | null = null): SeenPools => ({
  monthly: { plan: monthly, endsAt: null },
  addon: { plan: addon, endsAt: addonEndsAt },
});

const withCustom = (custom: [string, { monthly?: number; addon?: number }][], enabled = true): ScopeLimits => ({
  ...noLimits(),
  enabled,
  custom: new Map(custom),
});

const CYCLE = '2026-10-15T09:00:00.000Z';
const ADDON_END = '2026-10-20T00:00:00.000Z';

/** @group ai */
describe('pool change (pure)', () => {
  describe('seenPools: plan sizes from the gateway balance', () => {
    it('reads plan.recurring / plan.topup and the add-on expiry', () => {
      expect(
        seenPools({
          plan: { recurring: 8000, topup: 500, total: 8500 },
          expiry: { recurringExpiryDate: '2026-11-01T00:00:00.000Z', topupExpiryDate: ADDON_END },
        })
      ).toEqual(seen(8000, 500, ADDON_END));
    });

    it('an older gateway without plan sizes → null (nothing to compare)', () => {
      expect(seenPools({ expiry: { recurringExpiryDate: null, topupExpiryDate: null } })).toBeNull();
    });
  });

  describe('sameSeen', () => {
    it('compares plan sizes and the add-on expiry instant, not its spelling', () => {
      expect(sameSeen(seen(1, 2, ADDON_END), seen(1, 2, '2026-10-20T00:00:00Z'))).toBe(true);
      expect(sameSeen(seen(1, 2), seen(1, 3))).toBe(false);
      expect(sameSeen(seen(1, 2, ADDON_END), seen(1, 2))).toBe(false);
      expect(sameSeen(undefined, seen(1, 2))).toBe(false);
    });
  });

  describe('poolChange: what the pool did since last seen', () => {
    it('lower monthly plan = plan change: both pools checked, dated by the new cycle start', () => {
      expect(poolChange(seen(10_000, 500), seen(4000, 500), CYCLE)).toEqual({
        reason: 'plan_change',
        pools: ['monthly', 'addon'],
        on: CYCLE,
      });
    });

    it('lower add-on plan = add-on expiry: add-on only, dated by the expiry last seen', () => {
      expect(poolChange(seen(10_000, 500, ADDON_END), seen(10_000, 0), CYCLE)).toEqual({
        reason: 'addon_expiry',
        pools: ['addon'],
        on: ADDON_END,
      });
    });

    it('renewal (same plan, overdraft carry-in only lowers the balance) → no change', () => {
      expect(poolChange(seen(10_000, 0), seen(10_000, 0), CYCLE)).toBeNull();
    });

    it('growth (upgrade, add-on purchase) and the first read → no change', () => {
      expect(poolChange(seen(4000, 0), seen(10_000, 500), CYCLE)).toBeNull();
      expect(poolChange(undefined, seen(10_000, 500), CYCLE)).toBeNull();
    });
  });

  describe('adjustToPool', () => {
    it('AC1: custom 3,000 over a new max of 2,000 becomes the default; notice says what changed', () => {
      // 4 builders; new pool 2,003 → b0 may hold 2,003 − 3 × 1 = 2,000.
      const limits = withCustom([['b0', { monthly: 3000 }]]);
      const out = adjustToPool({
        pools: { monthly: 2003, addon: 0 },
        previousPools: { monthly: 10_000, addon: 0 },
        builderIds: ids(4),
        limits,
        change: { reason: 'plan_change', pools: ['monthly', 'addon'], on: CYCLE },
      });

      expect(out.reset).toEqual([{ userId: 'b0', pool: 'monthly', before: 3000 }]);
      expect(out.limits.custom.has('b0')).toBe(false);
      expect(out.notice).toEqual({
        kind: 'plan_change',
        on: CYCLE,
        defaultBefore: 2333,
        defaultAfter: 500,
        reduced: 1,
      });
      expect(limits.custom.get('b0')).toEqual({ monthly: 3000 }); // input untouched
    });

    it('custom limits that still fit stay', () => {
      const out = adjustToPool({
        pools: { monthly: 2003, addon: 0 },
        previousPools: { monthly: 10_000, addon: 0 },
        builderIds: ids(4),
        limits: withCustom([['b0', { monthly: 2000 }]]),
        change: { reason: 'plan_change', pools: ['monthly', 'addon'], on: CYCLE },
      });
      expect(out.reset).toEqual([]);
      expect(out.limits.custom.get('b0')).toEqual({ monthly: 2000 });
    });

    it('resets the largest first, only until the pool fits', () => {
      // 4 builders, pool 1,000: customs 600 + 300 + 2 × 1 = 902 fits after 700 goes.
      const out = adjustToPool({
        pools: { monthly: 1000, addon: 0 },
        previousPools: { monthly: 5000, addon: 0 },
        builderIds: ids(4),
        limits: withCustom([
          ['b0', { monthly: 300 }],
          ['b1', { monthly: 700 }],
          ['b2', { monthly: 600 }],
        ]),
        change: { reason: 'plan_change', pools: ['monthly', 'addon'], on: CYCLE },
      });
      expect(out.reset.map((r) => r.userId)).toEqual(['b1']);
      expect(out.notice.reduced).toBe(1);
    });

    it('AC3: add-on expiry changes add-on limits only', () => {
      const out = adjustToPool({
        pools: { monthly: 1000, addon: 40 },
        previousPools: { monthly: 1000, addon: 2000 },
        builderIds: ids(2),
        limits: withCustom([
          ['b0', { monthly: 900, addon: 1500 }],
          ['b1', { addon: 300 }],
        ]),
        change: { reason: 'addon_expiry', pools: ['addon'], on: ADDON_END },
      });
      expect(out.reset).toEqual([
        { userId: 'b0', pool: 'addon', before: 1500 },
        { userId: 'b1', pool: 'addon', before: 300 },
      ]);
      expect(out.limits.custom.get('b0')).toEqual({ monthly: 900 });
      expect(out.limits.custom.has('b1')).toBe(false);
      expect(out.notice).toMatchObject({ kind: 'addon_expiry', on: ADDON_END, defaultAfter: 20, reduced: 2 });
    });

    it('custom rows of people who are not builders here are ignored', () => {
      const out = adjustToPool({
        pools: { monthly: 100, addon: 0 },
        previousPools: { monthly: 5000, addon: 0 },
        builderIds: ids(2),
        limits: withCustom([['gone', { monthly: 4000 }]]),
        change: { reason: 'plan_change', pools: ['monthly', 'addon'], on: CYCLE },
      });
      expect(out.reset).toEqual([]);
    });

    it('nothing reset and the default did not fall → no notice', () => {
      const out = adjustToPool({
        pools: { monthly: 1000, addon: 0 },
        previousPools: { monthly: 1000, addon: 0 },
        builderIds: ids(2),
        limits: withCustom([]),
        change: { reason: 'plan_change', pools: ['monthly', 'addon'], on: CYCLE },
      });
      expect(out.notice).toBeNull();
    });

    it('the default falling alone is a notice with 0 reduced', () => {
      const out = adjustToPool({
        pools: { monthly: 1000, addon: 0 },
        previousPools: { monthly: 4000, addon: 0 },
        builderIds: ids(2),
        limits: withCustom([]),
        change: { reason: 'plan_change', pools: ['monthly', 'addon'], on: CYCLE },
      });
      expect(out.notice).toMatchObject({ defaultBefore: 2000, defaultAfter: 500, reduced: 0 });
    });
  });

  it('poolsAdjustedEvent: system event with reason, pool sizes, default before/after and each reset', () => {
    const event = poolsAdjustedEvent({
      change: { reason: 'plan_change', pools: ['monthly', 'addon'], on: CYCLE },
      previousPools: { monthly: 10_000, addon: 0 },
      pools: { monthly: 2003, addon: 0 },
      notice: { kind: 'plan_change', on: CYCLE, defaultBefore: 2333, defaultAfter: 500, reduced: 1 },
      reset: [{ userId: 'b0', pool: 'monthly', before: 3000 }],
      emails: new Map([['b0', 'b0@tooljet.io']]),
    });
    expect(event).toEqual({
      actionType: 'AI_CREDIT_LIMITS_ADJUSTED',
      metadata: {
        reason: 'plan_change',
        on: CYCLE,
        poolsBefore: { monthly: 10_000, addon: 0 },
        poolsAfter: { monthly: 2003, addon: 0 },
        defaultBefore: 2333,
        defaultAfter: 500,
        customReduced: 1,
        builders: [{ builderId: 'b0', builderEmail: 'b0@tooljet.io', pool: 'monthly', before: 3000, after: null }],
      },
    });
  });
});
