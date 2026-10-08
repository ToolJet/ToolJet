import {
  adjustToPool,
  currentNotices,
  newScopeLimits,
  poolChange,
  poolsBefore,
  sameSeen,
  seenPools,
} from '@ee/ai/services/credit-limits';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `b${i}`);

/** @group ai */
describe('pool change (pure)', () => {
  describe('seenPools: plan sizes from the gateway balance', () => {
    it('a fractional plan size is floored (stored as an integer; a failed write would fail every read)', () => {
      expect(seenPools({ plan: { recurring: 2003.75, topup: 0.5 }, expiry: { topupExpiryDate: null } })).toEqual({
        monthly: { plan: 2003, endsAt: null },
        addon: { plan: 0, endsAt: null },
      });
    });

    it('an older gateway without plan sizes gives null: nothing to compare', () => {
      expect(seenPools({ expiry: { recurringExpiryDate: null, topupExpiryDate: null } })).toBeNull();
    });
  });

  it('sameSeen compares plan sizes and the add-on expiry instant, not its spelling', () => {
    const seen = {
      monthly: { plan: 1, endsAt: null },
      addon: { plan: 2, endsAt: '2026-10-20T00:00:00.000Z' },
    };

    expect(sameSeen(seen, { ...seen, addon: { plan: 2, endsAt: '2026-10-20T00:00:00Z' } })).toBe(true);
    expect(sameSeen(seen, { ...seen, addon: { plan: 3, endsAt: '2026-10-20T00:00:00.000Z' } })).toBe(false);
    expect(sameSeen(seen, { ...seen, addon: { plan: 2, endsAt: null } })).toBe(false);
    expect(sameSeen(undefined, seen)).toBe(false);
  });

  describe('poolChange: what the pool did since last seen', () => {
    it('an add-on removed before its expiry is dated when it was found, never by the future expiry', () => {
      const lastSeen = {
        monthly: { plan: 10_000, endsAt: null },
        addon: { plan: 500, endsAt: '2026-10-20T00:00:00.000Z' },
      };
      const now = { monthly: { plan: 10_000, endsAt: null }, addon: { plan: 0, endsAt: null } };

      expect(poolChange(lastSeen, now, '2026-10-15T09:00:00.000Z', '2026-10-15T09:05:00.000Z')).toEqual({
        reason: 'addon_expiry',
        pools: ['addon'],
        shrunk: ['addon'],
        on: '2026-10-15T09:05:00.000Z',
      });
    });

    it('a plan change and an add-on expiry between two reads: a plan change with both pools shrunk, each at its old size', () => {
      const lastSeen = {
        monthly: { plan: 5000, endsAt: null },
        addon: { plan: 500, endsAt: '2026-10-20T00:00:00.000Z' },
      };
      const now = { monthly: { plan: 2000, endsAt: null }, addon: { plan: 0, endsAt: null } };

      const change = poolChange(lastSeen, now, '2026-10-15T09:00:00.000Z', '2026-10-15T09:05:00.000Z');

      expect(change).toEqual({
        reason: 'plan_change',
        pools: ['monthly', 'addon'],
        shrunk: ['monthly', 'addon'],
        on: '2026-10-15T09:00:00.000Z',
      });
      expect(poolsBefore({ monthly: 2000, addon: 0 }, lastSeen, change)).toEqual({ monthly: 5000, addon: 500 });
    });

    it('growth (an upgrade or an add-on purchase) and the first read are not a change', () => {
      const small = { monthly: { plan: 4000, endsAt: null }, addon: { plan: 0, endsAt: null } };
      const large = { monthly: { plan: 10_000, endsAt: null }, addon: { plan: 500, endsAt: null } };

      expect(poolChange(small, large, '2026-10-15T09:00:00.000Z', '2026-10-15T09:05:00.000Z')).toBeNull();
      expect(poolChange(undefined, large, '2026-10-15T09:00:00.000Z', '2026-10-15T09:05:00.000Z')).toBeNull();
    });
  });

  describe('adjustToPool', () => {
    const planChange = {
      reason: 'plan_change' as const,
      pools: ['monthly' as const, 'addon' as const],
      shrunk: ['monthly' as const],
      on: '2026-10-15T09:00:00.000Z',
    };
    const addonExpiry = {
      reason: 'addon_expiry' as const,
      pools: ['addon' as const],
      shrunk: ['addon' as const],
      on: '2026-10-20T00:00:00.000Z',
    };

    it('custom limits that still fit stay', () => {
      // 4 builders on 2,003: b0 may hold 2,003 − 3 = 2,000.
      const out = adjustToPool({
        pools: { monthly: 2003, addon: 0 },
        previousPools: { monthly: 10_000, addon: 0 },
        builderIds: ids(4),
        limits: { ...newScopeLimits(), custom: new Map([['b0', { monthly: 2000 }]]) },
        change: planChange,
        detectedAt: '2026-10-15T09:05:00.000Z',
      });

      expect(out.reset).toEqual([]);
      expect(out.limits.custom.get('b0')).toEqual({ monthly: 2000 });
    });

    it('resets the largest custom limit first, only until the pool fits', () => {
      // 4 builders on 1,000: 600 + 300 + 2 × 1 = 902 fits once the 700 goes.
      const out = adjustToPool({
        pools: { monthly: 1000, addon: 0 },
        previousPools: { monthly: 5000, addon: 0 },
        builderIds: ids(4),
        limits: {
          ...newScopeLimits(),
          custom: new Map([
            ['b0', { monthly: 300 }],
            ['b1', { monthly: 700 }],
            ['b2', { monthly: 600 }],
          ]),
        },
        change: planChange,
        detectedAt: '2026-10-15T09:05:00.000Z',
      });

      expect(out.reset).toEqual([{ userId: 'b1', pool: 'monthly', before: 700 }]);
      expect(out.notice.reduced).toBe(1);
    });

    it('an add-on expiry leaves an over-allocated monthly custom limit alone', () => {
      // After an overdraft renewal the monthly pool is 1,000; b0's 1,500 is over its max, but this is add-on only.
      const out = adjustToPool({
        pools: { monthly: 1000, addon: 0 },
        previousPools: { monthly: 1000, addon: 500 },
        builderIds: ids(2),
        limits: { ...newScopeLimits(), custom: new Map([['b0', { monthly: 1500, addon: 400 }]]) },
        change: addonExpiry,
        detectedAt: '2026-10-20T00:05:00.000Z',
      });

      expect(out.reset).toEqual([{ userId: 'b0', pool: 'addon', before: 400 }]);
      expect(out.limits.custom.get('b0')).toEqual({ monthly: 1500 });
    });

    it('both pools shrank: one notice naming both defaults, counting every reset', () => {
      // 3 builders; monthly 5,000 → 2,000, add-on 500 → 0. b0's add-on 400 no longer fits.
      const out = adjustToPool({
        pools: { monthly: 2000, addon: 0 },
        previousPools: { monthly: 5000, addon: 500 },
        builderIds: ids(3),
        limits: { ...newScopeLimits(), custom: new Map([['b0', { addon: 400 }]]) },
        change: { ...planChange, shrunk: ['monthly', 'addon'] },
        detectedAt: '2026-10-15T09:05:00.000Z',
      });

      expect(out.reset).toEqual([{ userId: 'b0', pool: 'addon', before: 400 }]);
      expect(out.notice).toEqual({
        kind: 'plan_change',
        on: '2026-10-15T09:00:00.000Z',
        detectedAt: '2026-10-15T09:05:00.000Z',
        defaults: { monthly: { before: 1666, after: 666 }, addon: { before: 50, after: 0 } },
        reduced: 1,
      });
    });

    it('custom limits of people who are not builders here are ignored', () => {
      const out = adjustToPool({
        pools: { monthly: 100, addon: 0 },
        previousPools: { monthly: 5000, addon: 0 },
        builderIds: ids(2),
        limits: { ...newScopeLimits(), custom: new Map([['gone', { monthly: 4000 }]]) },
        change: planChange,
        detectedAt: '2026-10-15T09:05:00.000Z',
      });

      expect(out.reset).toEqual([]);
    });

    it('nothing reset and the default did not fall: no notice', () => {
      const out = adjustToPool({
        pools: { monthly: 1000, addon: 0 },
        previousPools: { monthly: 1000, addon: 0 },
        builderIds: ids(2),
        limits: newScopeLimits(),
        change: planChange,
        detectedAt: '2026-10-15T09:05:00.000Z',
      });

      expect(out.notice).toBeNull();
    });

    it('the default falling alone is a notice with 0 reduced', () => {
      const out = adjustToPool({
        pools: { monthly: 1000, addon: 0 },
        previousPools: { monthly: 4000, addon: 0 },
        builderIds: ids(2),
        limits: newScopeLimits(),
        change: planChange,
        detectedAt: '2026-10-15T09:05:00.000Z',
      });

      expect(out.notice).toEqual({
        kind: 'plan_change',
        on: '2026-10-15T09:00:00.000Z',
        detectedAt: '2026-10-15T09:05:00.000Z',
        defaults: { monthly: { before: 2000, after: 500 } },
        reduced: 0,
      });
    });
  });

  describe('currentNotices: only notices found in the current cycle', () => {
    const found = (detectedAt: string) => ({
      kind: 'plan_change' as const,
      on: '2026-10-15T09:00:00.000Z',
      detectedAt,
      defaults: { monthly: { before: 2333, after: 500 } },
      reduced: 1,
    });

    it('a notice from an earlier cycle is hidden; one from this cycle shows', () => {
      const earlier = found('2026-09-20T00:00:00.000Z');
      const current = found('2026-10-15T09:05:00.000Z');

      expect(currentNotices([earlier, current], '2026-10-15T09:00:00.000Z')).toEqual([current]);
    });

    it('with the cycle start unknown, every notice shows', () => {
      const earlier = found('2026-09-20T00:00:00.000Z');

      expect(currentNotices([earlier], null)).toEqual([earlier]);
    });
  });
});
