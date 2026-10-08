import {
  available,
  builderMax,
  equalShare,
  isAtLimit,
  limitEvents,
  logicalSplit,
  parallelRunPolicy,
  parallelRunRefusal,
  resolveLimits,
  ScopeLimits,
} from '@ee/ai/services/credit-limits';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `b${i}`);

/** @group ai */
describe('credit limits (pure)', () => {
  describe('equal share', () => {
    it.each([
      ['80,000 over 40 builders', 80_000, 0, 40, 2000],
      ['80,000 over 41 builders, rounded down', 80_000, 0, 41, 1951],
      ['custom limits come off first', 80_000, 6000, 38, 1947],
      ['0 builders: the whole pool', 80_000, 0, 0, 80_000],
      ['1 builder: the whole pool', 80_000, 0, 1, 80_000],
      ['an empty pool', 0, 0, 40, 0],
      ['more builders than credits', 30, 0, 40, 0],
      ['custom limits over the pool never go negative', 100, 500, 2, 0],
    ])('%s', (_name, pool, customTotal, builders, share) => {
      expect(equalShare(pool, customTotal, builders)).toBe(share);
    });
  });

  describe('resolveLimits', () => {
    const equalShareOn: ScopeLimits = {
      enabled: true,
      defaults: { monthly: { mode: 'equal_share' }, addon: { mode: 'equal_share' } },
      custom: new Map(),
    };

    it('0 builders: the default is the whole pool and the card says there are no builders yet', () => {
      const r = resolveLimits({ pools: { monthly: 80_000, addon: 0 }, builderIds: [], limits: equalShareOn });

      expect(r.defaults.monthly).toMatchObject({ effective: 80_000, max: 80_000, note: 'noBuilders' });
    });

    it('an add-on pool of 0 gives 0 and the card says there are no credits', () => {
      const r = resolveLimits({ pools: { monthly: 80_000, addon: 0 }, builderIds: ids(3), limits: equalShareOn });

      expect(r.defaults.addon).toMatchObject({ effective: 0, max: 0, note: 'noCredits', unallocatedPct: 0 });
    });

    it('more builders than credits gives 0 and the card says so', () => {
      const r = resolveLimits({ pools: { monthly: 30, addon: 10 }, builderIds: ids(40), limits: equalShareOn });

      expect(r.defaults.monthly).toMatchObject({ effective: 0, note: 'tooManyBuilders', unallocated: 30 });
    });

    it('a custom default of 2,000 holds for 40 builders and is reduced to 1,951 for 41', () => {
      const limits: ScopeLimits = {
        enabled: true,
        defaults: { monthly: { mode: 'custom', value: 2000 }, addon: { mode: 'equal_share' } },
        custom: new Map(),
      };
      const pools = { monthly: 80_000, addon: 20_000 };

      const forty = resolveLimits({ pools, builderIds: ids(40), limits });
      const fortyOne = resolveLimits({ pools, builderIds: ids(41), limits });

      expect(forty.defaults.monthly).toMatchObject({ mode: 'custom', value: 2000, effective: 2000, note: null });
      expect(fortyOne.defaults.monthly).toMatchObject({ value: 2000, effective: 1951, note: 'reduced' });
      // 41 × 1,951 = 79,991: within the pool.
      expect(fortyOne.byBuilder.get('b40').monthly).toBe(1951);
    });

    it('reports the credits and % left over after every builder gets the default', () => {
      const r = resolveLimits({
        pools: { monthly: 80_000, addon: 20_000 },
        builderIds: ids(40),
        limits: {
          enabled: true,
          defaults: { monthly: { mode: 'equal_share' }, addon: { mode: 'custom', value: 400 } },
          custom: new Map(),
        },
      });

      expect(r.defaults.monthly).toMatchObject({ unallocated: 0, unallocatedPct: 0 });
      expect(r.defaults.addon).toMatchObject({
        pool: 20_000,
        buildersWithoutCustom: 40,
        customTotal: 0,
        unallocated: 4000,
        unallocatedPct: 20,
      });
    });
  });

  describe('builderMax: the largest custom limit one builder may get', () => {
    const pools = { monthly: 80_000, addon: 4_000 };

    it('with an equal-share default, every other builder keeps 1 credit', () => {
      // 40 builders, b0 holds 3,000: b1 may take 80,000 − 3,000 − 38 and 4,000 − 39.
      const limits: ScopeLimits = {
        enabled: true,
        defaults: { monthly: { mode: 'equal_share' }, addon: { mode: 'equal_share' } },
        custom: new Map([
          ['b0', { monthly: 3000 }],
          ['b1', { monthly: 5000 }],
        ]),
      };

      // b1's own 5,000 does not count against them.
      expect(builderMax({ pools, builderIds: ids(40), limits, userId: 'b1' })).toEqual({
        monthly: 76_962,
        addon: 3961,
      });
    });

    it('with a custom default, every other builder without a custom limit keeps that default', () => {
      const limits: ScopeLimits = {
        enabled: true,
        defaults: { monthly: { mode: 'custom', value: 1000 }, addon: { mode: 'equal_share' } },
        custom: new Map([['b0', { monthly: 3000 }]]),
      };

      // 80,000 − 3,000 − 38 × 1,000.
      expect(builderMax({ pools, builderIds: ids(40), limits, userId: 'b1' }).monthly).toBe(39_000);
    });

    it('with a reduced custom default, the others keep what they actually get, not the saved value', () => {
      // 45 builders: a custom 2,000 is reduced to 80,000 ÷ 45 = 1,777.
      const limits: ScopeLimits = {
        enabled: true,
        defaults: { monthly: { mode: 'custom', value: 2000 }, addon: { mode: 'equal_share' } },
        custom: new Map(),
      };

      // 80,000 − 44 × 1,777.
      expect(builderMax({ pools, builderIds: ids(45), limits, userId: 'b1' }).monthly).toBe(1812);
      const atMax = resolveLimits({
        pools,
        builderIds: ids(45),
        limits: { ...limits, custom: new Map([['b1', { monthly: 1812 }]]) },
      });
      expect(atMax.defaults.monthly.effective).toBe(1777);
    });
  });

  it('saving the same defaults while on logs nothing', () => {
    const limits: ScopeLimits = {
      enabled: true,
      defaults: { monthly: { mode: 'custom', value: 1000 }, addon: { mode: 'equal_share' } },
      custom: new Map(),
    };

    expect(limitEvents(limits, limits, 0)).toEqual([]);
  });

  describe('logicalSplit, available and isAtLimit: the usage table and enforcement share them', () => {
    const limit = { monthly: 2000, addon: 400 };

    it('the first {monthly limit} credits of combined spend are monthly, whatever the wallet said', () => {
      expect(logicalSplit({ monthly: 1700, addon: 300 }, limit)).toEqual({ monthly: 2000, addon: 0 });
      expect(logicalSplit({ monthly: 0, addon: 600 }, limit)).toEqual({ monthly: 600, addon: 0 });
    });

    it('over both: monthly caps at its limit, add-on shows the real overshoot', () => {
      expect(logicalSplit({ monthly: 2100, addon: 500 }, limit)).toEqual({ monthly: 2000, addon: 600 });
    });

    it('no add-on limit: everything stays monthly, overshoot included', () => {
      expect(logicalSplit({ monthly: 1700, addon: 400 }, { monthly: 500, addon: 0 })).toEqual({
        monthly: 2100,
        addon: 0,
      });
    });

    it('a net refund stays on monthly; the split always sums to the spend', () => {
      expect(logicalSplit({ monthly: -50, addon: 0 }, limit)).toEqual({ monthly: -50, addon: 0 });
      expect(logicalSplit({ monthly: 500, addon: -100 }, limit)).toEqual({ monthly: 400, addon: 0 });
    });

    it('available never goes negative and treats a net refund as no spend', () => {
      expect(available({ monthly: 1000, addon: 0 }, { monthly: 1000, addon: 200 })).toEqual({ monthly: 0, addon: 200 });
      expect(available({ monthly: 1100, addon: 0 }, { monthly: 1000, addon: 200 })).toEqual({ monthly: 0, addon: 100 });
      expect(available({ monthly: 2100, addon: 50 }, { monthly: 1000, addon: 200 })).toEqual({ monthly: 0, addon: 0 });
      expect(available({ monthly: -50, addon: 0 }, { monthly: 1000, addon: 200 })).toEqual({
        monthly: 1000,
        addon: 200,
      });
    });

    it('at limit when combined use reaches the combined limit', () => {
      expect(isAtLimit({ monthly: 1947, addon: 400 }, { monthly: 1947, addon: 400 })).toBe(true);
      expect(isAtLimit({ monthly: 2100, addon: 0 }, { monthly: 1947, addon: 400 })).toBe(false);
      expect(isAtLimit({ monthly: 2100, addon: 400 }, { monthly: 1947, addon: 400 })).toBe(true);
    });
  });

  describe('parallel runs', () => {
    it.each([
      ['nothing running, 0% left: the spend check alone decides', 0, 0, null],
      ['2 running, exactly 20% left', 2, 20, null],
      ['3 running, 10% left: the cap is reported', 3, 10, 'run_cap'],
    ] as const)('%s', (_name, running, leftPercent, refusal) => {
      expect(parallelRunRefusal({ running, leftPercent, maxRuns: 3, headroomPercent: 20 })).toBe(refusal);
    });

    it('reads the cap and the headroom from the settings', () => {
      expect(
        parallelRunPolicy({ AI_CREDIT_MAX_PARALLEL_RUNS: '1', AI_CREDIT_PARALLEL_HEADROOM_PERCENT: '50' })
      ).toEqual({ maxRuns: 1, headroomPercent: 50 });
    });

    it.each([
      ['', ''],
      ['0', '-1'],
      ['-2', '150'],
      ['abc', 'abc'],
      ['1.5', ' '],
    ])('unset or invalid settings (%p, %p) fall back to 3 runs and 20%%', (max, headroom) => {
      expect(
        parallelRunPolicy({ AI_CREDIT_MAX_PARALLEL_RUNS: max, AI_CREDIT_PARALLEL_HEADROOM_PERCENT: headroom })
      ).toEqual({ maxRuns: 3, headroomPercent: 20 });
    });
  });
});
