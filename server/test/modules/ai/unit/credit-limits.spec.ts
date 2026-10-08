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
describe('credit limits', () => {
  describe('equalShare()', () => {
    it.each([
      ['should give 2,000 for 80,000 over 40 builders', 80_000, 0, 40, 2000],
      ['should round 80,000 over 41 builders down to 1,951', 80_000, 0, 41, 1951],
      ['should take custom limits off first', 80_000, 6000, 38, 1947],
      ['should give 0 builders the whole pool', 80_000, 0, 0, 80_000],
      ['should give 1 builder the whole pool', 80_000, 0, 1, 80_000],
      ['should give 0 from an empty pool', 0, 0, 40, 0],
      ['should give 0 with more builders than credits', 30, 0, 40, 0],
      ['should never go negative with custom limits over the pool', 100, 500, 2, 0],
    ])('%s', (_name, pool, customTotal, builders, share) => {
      expect(equalShare(pool, customTotal, builders)).toBe(share);
    });
  });

  describe('resolveLimits()', () => {
    const equalShareOn: ScopeLimits = {
      enabled: true,
      defaults: { monthly: { mode: 'equal_share' }, addon: { mode: 'equal_share' } },
      custom: new Map(),
    };

    describe('with 0 builders', () => {
      it('should make the default the whole pool with the noBuilders note', () => {
        const r = resolveLimits({ pools: { monthly: 80_000, addon: 0 }, builderIds: [], limits: equalShareOn });

        expect(r.defaults.monthly).toMatchObject({ effective: 80_000, max: 80_000, note: 'noBuilders' });
      });
    });

    describe('with an add-on pool of 0', () => {
      it('should give 0 with the noCredits note', () => {
        const r = resolveLimits({ pools: { monthly: 80_000, addon: 0 }, builderIds: ids(3), limits: equalShareOn });

        expect(r.defaults.addon).toMatchObject({ effective: 0, max: 0, note: 'noCredits', unallocatedPct: 0 });
      });
    });

    describe('with more builders than credits', () => {
      it('should give 0 with the tooManyBuilders note', () => {
        const r = resolveLimits({ pools: { monthly: 30, addon: 10 }, builderIds: ids(40), limits: equalShareOn });

        expect(r.defaults.monthly).toMatchObject({ effective: 0, note: 'tooManyBuilders', unallocated: 30 });
      });
    });

    describe('with a custom default of 2,000', () => {
      it('should hold it for 40 builders and reduce it to 1,951 for 41', () => {
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
        // 41 builders at 1,951 each use 79,991, which fits in the 80,000 pool.
        expect(fortyOne.byBuilder.get('b40').monthly).toBe(1951);
      });
    });

    describe('with a custom add-on default of 400 for 40 builders', () => {
      it('should report 4,000 credits and 20% left over after every builder gets the default', () => {
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
  });

  describe('builderMax()', () => {
    const pools = { monthly: 80_000, addon: 4_000 };

    describe('with an equal-share default', () => {
      it('should leave every other builder 1 credit', () => {
        // 40 builders share 80,000 monthly + 4,000 add-on.
        // b0 holds a custom 3,000 monthly. b1's own 5,000 is the limit being changed, so it does not count.
        // Every other builder must keep at least 1 credit: 38 others on monthly (b0 has a custom one), 39 on add-on.
        // b1's monthly max: 80,000 − 3,000 − 38 = 76,962.
        // b1's add-on max: 4,000 − 39 = 3,961.
        const limits: ScopeLimits = {
          enabled: true,
          defaults: { monthly: { mode: 'equal_share' }, addon: { mode: 'equal_share' } },
          custom: new Map([
            ['b0', { monthly: 3000 }],
            ['b1', { monthly: 5000 }],
          ]),
        };

        expect(builderMax({ pools, builderIds: ids(40), limits, userId: 'b1' })).toEqual({
          monthly: 76_962,
          addon: 3961,
        });
      });
    });

    describe('with a custom default', () => {
      it('should leave every other builder without a custom limit that default', () => {
        const limits: ScopeLimits = {
          enabled: true,
          defaults: { monthly: { mode: 'custom', value: 1000 }, addon: { mode: 'equal_share' } },
          custom: new Map([['b0', { monthly: 3000 }]]),
        };

        // b0 holds a custom 3,000; the 38 other builders keep the 1,000 default.
        // b1's monthly max: 80,000 − 3,000 − 38 × 1,000 = 39,000.
        expect(builderMax({ pools, builderIds: ids(40), limits, userId: 'b1' }).monthly).toBe(39_000);
      });
    });

    describe('with a reduced custom default', () => {
      it('should leave the others what they actually get, not the saved value', () => {
        // 45 builders at the custom 2,000 would need 90,000, more than the 80,000 pool,
        //   so the default is reduced to 80,000 ÷ 45 = 1,777 (rounded down).
        const limits: ScopeLimits = {
          enabled: true,
          defaults: { monthly: { mode: 'custom', value: 2000 }, addon: { mode: 'equal_share' } },
          custom: new Map(),
        };

        // The 44 other builders keep the 1,777 they actually get: b1's max is 80,000 − 44 × 1,777 = 1,812.
        expect(builderMax({ pools, builderIds: ids(45), limits, userId: 'b1' }).monthly).toBe(1812);
        const atMax = resolveLimits({
          pools,
          builderIds: ids(45),
          limits: { ...limits, custom: new Map([['b1', { monthly: 1812 }]]) },
        });
        expect(atMax.defaults.monthly.effective).toBe(1777);
      });
    });
  });

  describe('limitEvents()', () => {
    describe('when the same defaults are saved while on', () => {
      it('should log nothing', () => {
        const limits: ScopeLimits = {
          enabled: true,
          defaults: { monthly: { mode: 'custom', value: 1000 }, addon: { mode: 'equal_share' } },
          custom: new Map(),
        };

        expect(limitEvents(limits, limits, 0)).toEqual([]);
      });
    });
  });

  describe('logicalSplit()', () => {
    const limit = { monthly: 2000, addon: 400 };

    it('should count the first {monthly limit} credits of combined spend as monthly, whatever the wallet said', () => {
      expect(logicalSplit({ monthly: 1700, addon: 300 }, limit)).toEqual({ monthly: 2000, addon: 0 });
      expect(logicalSplit({ monthly: 0, addon: 600 }, limit)).toEqual({ monthly: 600, addon: 0 });
    });

    describe('when spend is over both limits', () => {
      it('should cap monthly at its limit and show the real add-on overshoot', () => {
        expect(logicalSplit({ monthly: 2100, addon: 500 }, limit)).toEqual({ monthly: 2000, addon: 600 });
      });
    });

    describe('with no add-on limit', () => {
      it('should keep everything monthly, overshoot included', () => {
        expect(logicalSplit({ monthly: 1700, addon: 400 }, { monthly: 500, addon: 0 })).toEqual({
          monthly: 2100,
          addon: 0,
        });
      });
    });

    describe('with a net refund', () => {
      it('should keep it on monthly with the split summing to the spend', () => {
        expect(logicalSplit({ monthly: -50, addon: 0 }, limit)).toEqual({ monthly: -50, addon: 0 });
        expect(logicalSplit({ monthly: 500, addon: -100 }, limit)).toEqual({ monthly: 400, addon: 0 });
      });
    });
  });

  describe('available()', () => {
    it('should never go negative and treat a net refund as no spend', () => {
      expect(available({ monthly: 1000, addon: 0 }, { monthly: 1000, addon: 200 })).toEqual({ monthly: 0, addon: 200 });
      expect(available({ monthly: 1100, addon: 0 }, { monthly: 1000, addon: 200 })).toEqual({ monthly: 0, addon: 100 });
      expect(available({ monthly: 2100, addon: 50 }, { monthly: 1000, addon: 200 })).toEqual({ monthly: 0, addon: 0 });
      expect(available({ monthly: -50, addon: 0 }, { monthly: 1000, addon: 200 })).toEqual({
        monthly: 1000,
        addon: 200,
      });
    });
  });

  describe('isAtLimit()', () => {
    it('should be true once combined use reaches the combined limit', () => {
      expect(isAtLimit({ monthly: 1947, addon: 400 }, { monthly: 1947, addon: 400 })).toBe(true);
      expect(isAtLimit({ monthly: 2100, addon: 0 }, { monthly: 1947, addon: 400 })).toBe(false);
      expect(isAtLimit({ monthly: 2100, addon: 400 }, { monthly: 1947, addon: 400 })).toBe(true);
    });
  });

  describe('parallelRunRefusal()', () => {
    it.each([
      ['should not refuse with nothing running and 0% left (the spend check alone decides)', 0, 0, null],
      ['should not refuse with 2 running and exactly 20% left', 2, 20, null],
      ['should refuse with run_cap with 3 running and 10% left', 3, 10, 'run_cap'],
    ] as const)('%s', (_name, running, leftPercent, refusal) => {
      expect(parallelRunRefusal({ running, leftPercent, maxRuns: 3, headroomPercent: 20 })).toBe(refusal);
    });
  });

  describe('parallelRunPolicy()', () => {
    it('should read the cap and the headroom from the settings', () => {
      expect(
        parallelRunPolicy({ AI_CREDIT_MAX_PARALLEL_RUNS: '1', AI_CREDIT_PARALLEL_HEADROOM_PERCENT: '50' })
      ).toEqual({ maxRuns: 1, headroomPercent: 50 });
    });

    describe('with unset or invalid settings', () => {
      it.each([
        ['', ''],
        ['0', '-1'],
        ['-2', '150'],
        ['abc', 'abc'],
        ['1.5', ' '],
      ])('should fall back to 3 runs and 20%% for (%p, %p)', (max, headroom) => {
        expect(
          parallelRunPolicy({ AI_CREDIT_MAX_PARALLEL_RUNS: max, AI_CREDIT_PARALLEL_HEADROOM_PERCENT: headroom })
        ).toEqual({ maxRuns: 3, headroomPercent: 20 });
      });
    });
  });
});
