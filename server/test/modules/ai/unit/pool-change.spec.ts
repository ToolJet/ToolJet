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
describe('pool change', () => {
  describe('seenPools()', () => {
    describe('with a fractional plan size', () => {
      it('should floor it (stored as an integer; a failed write would fail every read)', () => {
        expect(seenPools({ plan: { recurring: 2003.75, topup: 0.5 }, expiry: { topupExpiryDate: null } })).toEqual({
          monthly: { plan: 2003, endsAt: null },
          addon: { plan: 0, endsAt: null },
        });
      });
    });

    describe('with an older gateway without plan sizes', () => {
      it('should return null (nothing to compare)', () => {
        expect(seenPools({ expiry: { recurringExpiryDate: null, topupExpiryDate: null } })).toBeNull();
      });
    });
  });

  describe('sameSeen()', () => {
    it('should compare plan sizes and the add-on expiry instant, not its spelling', () => {
      const seen = {
        monthly: { plan: 1, endsAt: null },
        addon: { plan: 2, endsAt: '2026-10-20T00:00:00.000Z' },
      };

      expect(sameSeen(seen, { ...seen, addon: { plan: 2, endsAt: '2026-10-20T00:00:00Z' } })).toBe(true);
      expect(sameSeen(seen, { ...seen, addon: { plan: 3, endsAt: '2026-10-20T00:00:00.000Z' } })).toBe(false);
      expect(sameSeen(seen, { ...seen, addon: { plan: 2, endsAt: null } })).toBe(false);
      expect(sameSeen(undefined, seen)).toBe(false);
    });
  });

  describe('poolChange()', () => {
    describe('when an add-on is removed before its expiry', () => {
      it('should date it when it was found, never by the future expiry', () => {
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
    });

    describe('with a plan change and an add-on expiry between two reads', () => {
      it('should report a plan change with both pools shrunk, each at its old size', () => {
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
    });

    describe('with growth (an upgrade or an add-on purchase) or the first read', () => {
      it('should report no change', () => {
        const small = { monthly: { plan: 4000, endsAt: null }, addon: { plan: 0, endsAt: null } };
        const large = { monthly: { plan: 10_000, endsAt: null }, addon: { plan: 500, endsAt: null } };

        expect(poolChange(small, large, '2026-10-15T09:00:00.000Z', '2026-10-15T09:05:00.000Z')).toBeNull();
        expect(poolChange(undefined, large, '2026-10-15T09:00:00.000Z', '2026-10-15T09:05:00.000Z')).toBeNull();
      });
    });
  });

  describe('adjustToPool()', () => {
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

    describe('with custom limits that still fit', () => {
      it('should keep them', () => {
        // 4 builders share a 2,003 monthly pool; the 3 others must keep at least 1 credit each.
        // So b0 may hold up to 2,003 − 3 = 2,000, and its custom 2,000 still fits.
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
    });

    describe('when custom limits no longer fit the pool', () => {
      it('should reset the largest custom limit first, only until the pool fits', () => {
        // 4 builders share a monthly pool cut from 5,000 to 1,000.
        // Custom limits: b0 300, b1 700, b2 600. b3 has the default and must keep at least 1.
        // Together they need 300 + 700 + 600 + 1 = 1,601, more than 1,000.
        // Resetting the largest (b1's 700) leaves 300 + 600 + 1 + 1 = 902, which fits, so it stops there.
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
    });

    describe('when an add-on expires', () => {
      it('should leave an over-allocated monthly custom limit alone', () => {
        // The add-on pool expired (500 to 0), so b0's 400 add-on limit is reset.
        // b0's 1,500 monthly is over the 999 one of 2 builders may hold in a 1,000 pool,
        //   but an add-on expiry only adjusts add-on limits, so it stays.
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
    });

    describe('when both pools shrank', () => {
      it('should give one notice naming both defaults, counting every reset', () => {
        // 3 builders. The monthly pool fell from 5,000 to 2,000 and the add-on pool from 500 to 0.
        // b0's custom 400 add-on no longer fits and is reset.
        // Monthly default: 5,000 ÷ 3 = 1,666 before, 2,000 ÷ 3 = 666 after.
        // Add-on default: (500 − 400) ÷ 2 = 50 before, 0 after.
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
    });

    describe('with custom limits of people who are not builders here', () => {
      it('should ignore them', () => {
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
    });

    describe('when nothing is reset and the default did not fall', () => {
      it('should give no notice', () => {
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
    });

    describe('when only the default falls', () => {
      it('should give a notice with 0 reduced', () => {
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
  });

  describe('currentNotices()', () => {
    const found = (detectedAt: string) => ({
      kind: 'plan_change' as const,
      on: '2026-10-15T09:00:00.000Z',
      detectedAt,
      defaults: { monthly: { before: 2333, after: 500 } },
      reduced: 1,
    });

    describe('with notices from an earlier and the current cycle', () => {
      it('should hide the earlier one and show the current one', () => {
        const earlier = found('2026-09-20T00:00:00.000Z');
        const current = found('2026-10-15T09:05:00.000Z');

        expect(currentNotices([earlier, current], '2026-10-15T09:00:00.000Z')).toEqual([current]);
      });
    });

    describe('with the cycle start unknown', () => {
      it('should show every notice', () => {
        const earlier = found('2026-09-20T00:00:00.000Z');

        expect(currentNotices([earlier], null)).toEqual([earlier]);
      });
    });
  });
});
