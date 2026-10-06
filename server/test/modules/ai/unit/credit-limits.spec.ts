import {
  available,
  noLimits,
  ScopeLimits,
  countAtLimit,
  defaultError,
  equalShare,
  isAtLimit,
  limitEvents,
  resolveLimits,
} from '@ee/ai/services/credit-limits';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `b${i}`);

const on = (defaults: ScopeLimits['defaults'] = noLimits().defaults): ScopeLimits => ({
  enabled: true,
  defaults,
  custom: new Map(),
});

const total = (r: ReturnType<typeof resolveLimits>, pool: 'monthly' | 'addon') =>
  [...r.byBuilder.values()].reduce((acc, l) => acc + l[pool], 0);

/** @group ai */
describe('credit limits (pure)', () => {
  it('noLimits() is a fresh value: a custom limit set on one never reaches another scope', () => {
    noLimits().custom.set('b0', { monthly: 1 });
    expect(noLimits().custom.size).toBe(0);
  });

  describe('AC1: equal share', () => {
    it('80,000 over 40 builders is 2,000; over 41 it is 1,951', () => {
      expect(equalShare(80_000, 0, 40)).toBe(2000);
      expect(equalShare(80_000, 0, 41)).toBe(1951);
    });

    it('subtracts custom limits first and rounds down', () => {
      expect(equalShare(80_000, 6_000, 38)).toBe(1947);
    });

    it.each([
      ['0 builders', 80_000, 0, 80_000],
      ['1 builder', 80_000, 1, 80_000],
      ['an empty pool', 0, 40, 0],
      ['more builders than credits', 30, 40, 0],
      ['a fractional pool', 1000.75, 3, 333],
    ])('%s gives a defined, non-negative share', (_, pool, builders, share) => {
      expect(equalShare(pool, 0, builders)).toBe(share);
    });

    it('never goes negative when custom limits exceed the pool', () => {
      expect(equalShare(100, 500, 2)).toBe(0);
    });
  });

  describe('AC1: card notes for edge cases', () => {
    const pools = { monthly: 80_000, addon: 0 };

    it('0 builders: limit is the whole pool and the card says no builders yet', () => {
      const r = resolveLimits({ pools, builderIds: [], limits: on() });
      expect(r.defaults.monthly).toMatchObject({ effective: 80_000, max: 80_000, note: 'noBuilders' });
    });

    it('1 builder gets the whole pool', () => {
      const r = resolveLimits({ pools, builderIds: ids(1), limits: on() });
      expect(r.defaults.monthly).toMatchObject({ effective: 80_000, note: null, unallocated: 0 });
      expect(r.byBuilder.get('b0')).toEqual({ monthly: 80_000, addon: 0 });
    });

    it('an add-on pool of 0 gives 0 and the card says there are no credits', () => {
      const r = resolveLimits({ pools, builderIds: ids(3), limits: on() });
      expect(r.defaults.addon).toMatchObject({ effective: 0, max: 0, note: 'noCredits', unallocatedPct: 0 });
    });

    it('more builders than credits gives 0 and the card says so', () => {
      const r = resolveLimits({ pools: { monthly: 30, addon: 10 }, builderIds: ids(40), limits: on() });
      expect(r.defaults.monthly).toMatchObject({ effective: 0, note: 'tooManyBuilders', unallocated: 30 });
    });
  });

  describe('AC2: auto-clamp of a custom default', () => {
    const custom = on({ monthly: { mode: 'custom', value: 2000 }, addon: { mode: 'equal_share' } });
    const pools = { monthly: 80_000, addon: 20_000 };

    it('40 builders keep the custom 2,000', () => {
      const r = resolveLimits({ pools, builderIds: ids(40), limits: custom });
      expect(r.defaults.monthly).toMatchObject({ mode: 'custom', value: 2000, effective: 2000, note: null });
    });

    it('a 41st builder reduces it to 1,951 and the total stays within the pool', () => {
      const r = resolveLimits({ pools, builderIds: ids(41), limits: custom });
      expect(r.defaults.monthly).toMatchObject({ value: 2000, effective: 1951, note: 'reduced' });
      expect(total(r, 'monthly')).toBeLessThanOrEqual(80_000);
    });

    it('it returns to 2,000 when the builder leaves', () => {
      const r = resolveLimits({ pools, builderIds: ids(40), limits: custom });
      expect(r.defaults.monthly.effective).toBe(2000);
    });
  });

  describe('custom limits (s9 rows) stay out of the default', () => {
    it('builders with a custom limit keep it and the rest share the remainder', () => {
      const limits: ScopeLimits = { ...on(), custom: new Map([['b0', { monthly: 3000 }]]) };
      const r = resolveLimits({ pools: { monthly: 80_000, addon: 20_000 }, builderIds: ids(39), limits });
      expect(r.byBuilder.get('b0').monthly).toBe(3000);
      expect(r.byBuilder.get('b1').monthly).toBe(2026);
      expect(r.customCount).toBe(1);
      expect(total(r, 'monthly')).toBeLessThanOrEqual(80_000);
    });
  });

  describe('unallocated', () => {
    it('reports credits and % left after every builder gets the default', () => {
      const r = resolveLimits({
        pools: { monthly: 80_000, addon: 20_000 },
        builderIds: ids(40),
        limits: on({ monthly: { mode: 'equal_share' }, addon: { mode: 'custom', value: 400 } }),
      });
      expect(r.defaults.monthly).toMatchObject({ unallocated: 0, unallocatedPct: 0 });
      expect(r.defaults.addon).toMatchObject({ unallocated: 4000, unallocatedPct: 20 });
      expect(r.defaults.addon).toMatchObject({ pool: 20_000, buildersWithoutCustom: 40, customTotal: 0 });
    });
  });

  describe('defaultError', () => {
    it.each([
      [{ mode: 'equal_share' as const }, null],
      [{ mode: 'custom' as const, value: 1947 }, null],
      [{ mode: 'custom' as const, value: 1948 }, 'Cannot allocate more than 1,947 per builder'],
      [{ mode: 'custom' as const, value: 0 }, 'Enter a whole number of 1 or more.'],
      [{ mode: 'custom' as const, value: -5 }, 'Enter a whole number of 1 or more.'],
      [{ mode: 'custom' as const, value: 10.5 }, 'Enter a whole number of 1 or more.'],
    ])('%o → %s', (setting, error) => {
      expect(defaultError(setting, 1947)).toBe(error);
    });
  });

  describe('at limit', () => {
    it('combined use at or over the combined limit is at limit', () => {
      expect(isAtLimit({ monthly: 1947, addon: 400 }, { monthly: 1947, addon: 400 })).toBe(true);
      expect(isAtLimit({ monthly: 2100, addon: 0 }, { monthly: 1947, addon: 400 })).toBe(false);
      expect(isAtLimit({ monthly: 2100, addon: 400 }, { monthly: 1947, addon: 400 })).toBe(true);
      expect(isAtLimit({ monthly: 10, addon: 0 }, { monthly: 1000, addon: 0 })).toBe(false);
    });

    it('counts builders at their limit; no spend means 0', () => {
      const byBuilder = new Map([
        ['a', { monthly: 100, addon: 0 }],
        ['b', { monthly: 100, addon: 0 }],
        ['c', { monthly: 100, addon: 0 }],
      ]);
      const spend = new Map([
        ['a', { monthly: 100, addon: 0 }],
        ['b', { monthly: 150, addon: 0 }],
      ]);
      expect(countAtLimit(byBuilder, spend)).toBe(2);
    });
  });

  describe('AC5: audit events for one save', () => {
    const before = noLimits();
    const values = { monthly: { mode: 'custom' as const, value: 1000 }, addon: { mode: 'equal_share' as const } };

    it('turning on with new values logs ENABLED with the count over, and UPDATED with before and after', () => {
      const events = limitEvents(before, { enabled: true, defaults: values, custom: new Map() }, 2);
      expect(events).toEqual([
        { actionType: 'AI_CREDIT_LIMIT_ENABLED', metadata: { buildersOverLimit: 2 } },
        {
          actionType: 'AI_CREDIT_LIMIT_UPDATED',
          metadata: { before: before.defaults, after: values },
        },
      ]);
    });

    it('turning off logs DISABLED only', () => {
      const events = limitEvents(
        { enabled: true, defaults: values, custom: new Map() },
        { enabled: false, defaults: values, custom: new Map() },
        0
      );
      expect(events).toEqual([{ actionType: 'AI_CREDIT_LIMIT_DISABLED', metadata: {} }]);
    });

    it('saving the same values while on logs nothing', () => {
      const same = { enabled: true, defaults: values, custom: new Map() };
      expect(limitEvents(same, same, 0)).toEqual([]);
    });
  });
  describe('available (AC5)', () => {
    const limit = { monthly: 1000, addon: 200 };

    it('splits spend logically: the first {monthly limit} credits count as monthly', () => {
      expect(available({ monthly: 600, addon: 0 }, limit)).toEqual({ monthly: 400, addon: 200 });
      // Wallet attribution does not matter, only the combined spend.
      expect(available({ monthly: 0, addon: 600 }, limit)).toEqual({ monthly: 400, addon: 200 });
    });

    it('monthly limit reached but add-on left: still available', () => {
      expect(available({ monthly: 1000, addon: 0 }, limit)).toEqual({ monthly: 0, addon: 200 });
    });

    it('monthly overshoot spills into add-on and never makes available negative', () => {
      expect(available({ monthly: 1100, addon: 0 }, limit)).toEqual({ monthly: 0, addon: 100 });
      expect(available({ monthly: 2100, addon: 50 }, limit)).toEqual({ monthly: 0, addon: 0 });
    });

    it('a net refund counts as no spend', () => {
      expect(available({ monthly: -50, addon: 0 }, limit)).toEqual(limit);
    });
  });
});
