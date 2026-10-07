import { instanceToPlain, plainToInstance } from 'class-transformer';
import {
  adjustToPool,
  currentNotices,
  newScopeLimits,
  PoolChange,
  PoolNotice,
  poolChange,
  poolsAdjustedEvent,
  poolsBefore,
  sameSeen,
  ScopeLimits,
  SeenPools,
  seenPools,
} from '@ee/ai/services/credit-limits';
import { CreditsUsageResponseDto } from '@modules/ai/dto/credits-usage.dto';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `b${i}`);

const seen = (monthly: number, addon: number, addonEndsAt: string | null = null): SeenPools => ({
  monthly: { plan: monthly, endsAt: null },
  addon: { plan: addon, endsAt: addonEndsAt },
});

const withCustom = (custom: [string, { monthly?: number; addon?: number }][], enabled = true): ScopeLimits => ({
  ...newScopeLimits(),
  enabled,
  custom: new Map(custom),
});

const CYCLE = '2026-10-15T09:00:00.000Z';
const ADDON_END = '2026-10-20T00:00:00.000Z';
const DETECTED = '2026-10-15T09:05:00.000Z';
const PLAN_CHANGE: PoolChange = { reason: 'plan_change', pools: ['monthly', 'addon'], shrunk: ['monthly'], on: CYCLE };
const ADDON_EXPIRY: PoolChange = { reason: 'addon_expiry', pools: ['addon'], shrunk: ['addon'], on: ADDON_END };

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

    it('a fractional plan size is floored (stored as integer; a failed write would fail every read)', () => {
      expect(
        seenPools({
          plan: { recurring: 2003.75, topup: 0.5 },
          expiry: { topupExpiryDate: null },
        })
      ).toEqual(seen(2003, 0));
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
      expect(poolChange(seen(10_000, 500), seen(4000, 500), CYCLE)).toEqual(PLAN_CHANGE);
    });

    it('lower add-on plan = add-on expiry: add-on only, dated by the expiry last seen', () => {
      expect(poolChange(seen(10_000, 500, ADDON_END), seen(10_000, 0), CYCLE)).toEqual(ADDON_EXPIRY);
    });

    it('plan change and add-on expiry between two reads → plan change with both pools shrunk, each at its old size', () => {
      const change = poolChange(seen(5000, 500, ADDON_END), seen(2000, 0), CYCLE);
      expect(change).toEqual({ ...PLAN_CHANGE, shrunk: ['monthly', 'addon'] });
      expect(poolsBefore({ monthly: 2000, addon: 0 }, seen(5000, 500), change)).toEqual({ monthly: 5000, addon: 500 });
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
        change: PLAN_CHANGE,
        detectedAt: DETECTED,
      });

      expect(out.reset).toEqual([{ userId: 'b0', pool: 'monthly', before: 3000 }]);
      expect(out.limits.custom.has('b0')).toBe(false);
      expect(out.notice).toEqual({
        kind: 'plan_change',
        on: CYCLE,
        detectedAt: DETECTED,
        defaults: { monthly: { before: 2333, after: 500 } },
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
        change: PLAN_CHANGE,
        detectedAt: DETECTED,
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
        change: PLAN_CHANGE,
        detectedAt: DETECTED,
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
        change: ADDON_EXPIRY,
        detectedAt: DETECTED,
      });
      expect(out.reset).toEqual([
        { userId: 'b0', pool: 'addon', before: 1500 },
        { userId: 'b1', pool: 'addon', before: 300 },
      ]);
      expect(out.limits.custom.get('b0')).toEqual({ monthly: 900 });
      expect(out.limits.custom.has('b1')).toBe(false);
      expect(out.notice).toMatchObject({
        kind: 'addon_expiry',
        on: ADDON_END,
        defaults: { addon: { after: 20 } },
        reduced: 2,
      });
      expect(Object.keys(out.notice.defaults)).toEqual(['addon']);
    });

    it('AC3: add-on expiry leaves an over-allocated monthly custom limit alone (overdraft renewal)', () => {
      // Monthly pool 1,000 after an overdraft renewal; b0's 1,500 is over its max but this event is add-on only.
      const out = adjustToPool({
        pools: { monthly: 1000, addon: 0 },
        previousPools: { monthly: 1000, addon: 500 },
        builderIds: ids(2),
        limits: withCustom([['b0', { monthly: 1500, addon: 400 }]]),
        change: ADDON_EXPIRY,
        detectedAt: DETECTED,
      });
      expect(out.reset).toEqual([{ userId: 'b0', pool: 'addon', before: 400 }]);
      expect(out.limits.custom.get('b0')).toEqual({ monthly: 1500 });
    });

    it('both pools shrank: one notice naming both defaults, counting every reset', () => {
      // 3 builders; monthly 5,000 → 2,000, add-on 500 → 0. b0 add-on 400 no longer fits.
      const out = adjustToPool({
        pools: { monthly: 2000, addon: 0 },
        previousPools: { monthly: 5000, addon: 500 },
        builderIds: ids(3),
        limits: withCustom([['b0', { addon: 400 }]]),
        change: { ...PLAN_CHANGE, shrunk: ['monthly', 'addon'] },
        detectedAt: DETECTED,
      });
      expect(out.reset).toEqual([{ userId: 'b0', pool: 'addon', before: 400 }]);
      expect(out.notice).toEqual({
        kind: 'plan_change',
        on: CYCLE,
        detectedAt: DETECTED,
        defaults: { monthly: { before: 1666, after: 666 }, addon: { before: 50, after: 0 } },
        reduced: 1,
      });
    });

    it('custom rows of people who are not builders here are ignored', () => {
      const out = adjustToPool({
        pools: { monthly: 100, addon: 0 },
        previousPools: { monthly: 5000, addon: 0 },
        builderIds: ids(2),
        limits: withCustom([['gone', { monthly: 4000 }]]),
        change: PLAN_CHANGE,
        detectedAt: DETECTED,
      });
      expect(out.reset).toEqual([]);
    });

    it('nothing reset and the default did not fall → no notice', () => {
      const out = adjustToPool({
        pools: { monthly: 1000, addon: 0 },
        previousPools: { monthly: 1000, addon: 0 },
        builderIds: ids(2),
        limits: withCustom([]),
        change: PLAN_CHANGE,
        detectedAt: DETECTED,
      });
      expect(out.notice).toBeNull();
    });

    it('the default falling alone is a notice with 0 reduced', () => {
      const out = adjustToPool({
        pools: { monthly: 1000, addon: 0 },
        previousPools: { monthly: 4000, addon: 0 },
        builderIds: ids(2),
        limits: withCustom([]),
        change: PLAN_CHANGE,
        detectedAt: DETECTED,
      });
      expect(out.notice).toMatchObject({ defaults: { monthly: { before: 2000, after: 500 } }, reduced: 0 });
    });
  });

  describe('currentNotices: only notices found in the current cycle', () => {
    const notice = (detectedAt: string): PoolNotice => ({
      kind: 'plan_change',
      on: CYCLE,
      detectedAt,
      defaults: { monthly: { before: 2333, after: 500 } },
      reduced: 1,
    });

    it('a notice from an earlier cycle is hidden; one from this cycle shows', () => {
      const old = notice('2026-09-20T00:00:00.000Z');
      const fresh = notice(DETECTED);
      expect(currentNotices([old, fresh], CYCLE)).toEqual([fresh]);
    });

    it('cycle start unknown → shown', () => {
      expect(currentNotices([notice(DETECTED)], null)).toHaveLength(1);
    });
  });

  it('the usage response DTO serializes only exposed fields', () => {
    const body = instanceToPlain(
      plainToInstance(CreditsUsageResponseDto, {
        trackingSince: null,
        notices: [{ ...{ kind: 'plan_change', on: null, detectedAt: DETECTED, reduced: 0 }, secret: 1 }],
        internal: 'leak',
      })
    );
    expect(body).not.toHaveProperty('internal');
    expect(body.notices[0]).not.toHaveProperty('secret');
  });

  it('poolsAdjustedEvent: system event with reason, pool sizes, default before/after and each reset', () => {
    const event = poolsAdjustedEvent({
      change: PLAN_CHANGE,
      previousPools: { monthly: 10_000, addon: 0 },
      pools: { monthly: 2003, addon: 0 },
      notice: {
        kind: 'plan_change',
        on: CYCLE,
        detectedAt: DETECTED,
        defaults: { monthly: { before: 2333, after: 500 } },
        reduced: 1,
      },
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
        defaults: { monthly: { before: 2333, after: 500 } },
        customReduced: 1,
        builders: [{ builderId: 'b0', builderEmail: 'b0@tooljet.io', pool: 'monthly', before: 3000, after: null }],
      },
    });
  });
});
