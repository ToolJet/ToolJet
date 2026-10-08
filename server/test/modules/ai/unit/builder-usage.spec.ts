import {
  BuilderSpend,
  GatewayBalance,
  Membership,
  classifyPerson,
  joinUsageToPeople,
  poolTotals,
  resolveScopeLimits,
  toBuilderUsage,
  toCreditsUsage,
  toMyCredits,
} from '@ee/ai/services/builder-usage.service';
import { newScopeLimits } from '@ee/ai/services/credit-limits';

const totals = (recurring: number, topup = 0) => ({ recurring, topup, total: recurring + topup });

const member = (overrides: Partial<Membership> = {}): Membership => ({
  userId: 'u1',
  name: 'Priya Nair',
  email: 'priya@acme.io',
  userArchived: false,
  workspaceId: 'ws-a',
  activeMember: true,
  canEdit: true,
  ...overrides,
});

const sumRows = (rows: { monthly: number; addon: number }[]) =>
  rows.reduce((acc, r) => ({ monthly: acc.monthly + r.monthly, addon: acc.addon + r.addon }), { monthly: 0, addon: 0 });

/** @group ai */
describe('builder usage calculations', () => {
  describe('toBuilderUsage', () => {
    it('maps recurring/topup to monthly/addon, keeps the workspace split, and adds unattributed spend as a null user', () => {
      const usage = toBuilderUsage({
        cycleStart: '2026-10-01T00:00:00.000Z',
        trackingSince: '2026-10-03T00:00:00.000Z',
        users: [{ userId: 'u1', ...totals(100, 20), byOrganization: [{ organizationId: 'ws-a', ...totals(100, 20) }] }],
        unattributed: totals(11, 2),
        pool: totals(111, 22),
      });

      expect(usage).toEqual({
        cycleStart: '2026-10-01T00:00:00.000Z',
        trackingSince: '2026-10-03T00:00:00.000Z',
        spend: [
          { userId: 'u1', monthly: 100, addon: 20, byWorkspace: [{ organizationId: 'ws-a', monthly: 100, addon: 20 }] },
          { userId: null, monthly: 11, addon: 2 },
        ],
      });
    });

    it('skips zero unattributed spend and defaults a missing trackingSince to null', () => {
      const usage = toBuilderUsage({ cycleStart: null, users: [], unattributed: totals(0), pool: totals(0) });

      expect(usage).toEqual({ cycleStart: null, trackingSince: null, spend: [] });
    });
  });

  describe('classifyPerson', () => {
    it('is a builder with an active or invited admin/builder membership, listing only the workspaces they can edit', () => {
      expect(
        classifyPerson([
          member({ workspaceId: 'ws-a' }),
          member({ workspaceId: 'ws-b', activeMember: false }),
          member({ workspaceId: 'ws-c', canEdit: false }),
        ])
      ).toEqual({ kind: 'builder', workspaceIds: ['ws-a'] });
    });

    it('is archived when the user or every builder membership is archived', () => {
      expect(classifyPerson([member({ userArchived: true })]).kind).toBe('archived');
      expect(classifyPerson([member({ activeMember: false })]).kind).toBe('archived');
    });

    it('is a non-builder when no membership can edit', () => {
      expect(classifyPerson([member({ canEdit: false })]).kind).toBe('nonBuilder');
    });
  });

  describe('joinUsageToPeople', () => {
    const memberships = [
      member({ userId: 'builder' }),
      member({ userId: 'idle' }),
      member({ userId: 'end', canEdit: false }),
      member({ userId: 'quiet-end', canEdit: false }),
      member({ userId: 'gone', userArchived: true }),
    ];
    const spend: BuilderSpend[] = [
      { userId: 'builder', monthly: 50, addon: 20 },
      { userId: 'end', monthly: 5, addon: 0 },
      { userId: 'gone', monthly: 9, addon: 0 },
      { userId: 'stranger', monthly: 7, addon: 0, byWorkspace: [{ organizationId: 'ws-a', monthly: 7, addon: 0 }] },
      { userId: null, monthly: 11, addon: 2 },
    ];

    it('gives every builder a row, others only when they spent, and puts unattributed last', () => {
      const rows = joinUsageToPeople(spend, memberships, false);

      expect(rows.map((r) => [r.kind, r.userId])).toEqual([
        ['builder', 'builder'],
        ['builder', 'idle'],
        ['nonBuilder', 'end'],
        ['archived', 'gone'],
        ['unknown', 'stranger'],
        ['unattributed', undefined],
      ]);
      expect(rows.find((r) => r.userId === 'idle')).toMatchObject({ monthly: 0, addon: 0 });
      expect(rows.find((r) => r.kind === 'unknown')).toEqual({
        kind: 'unknown',
        userId: 'stranger',
        monthly: 7,
        addon: 0,
        byWorkspace: [{ organizationId: 'ws-a', monthly: 7, addon: 0 }],
      });
    });

    it('rows add up to total spend, negative spend included', () => {
      const withRefund = [...spend, { userId: 'idle', monthly: -3, addon: 0 }];

      expect(sumRows(joinUsageToPeople(withRefund, memberships, false))).toEqual({ monthly: 79, addon: 22 });
    });

    it('lists workspace memberships only when asked (self-hosted)', () => {
      expect(joinUsageToPeople(spend, memberships, true)[0].workspaceIds).toEqual(['ws-a']);
      expect(joinUsageToPeople(spend, memberships, false)[0].workspaceIds).toBeUndefined();
    });
  });

  describe('poolTotals', () => {
    it('sizes the pool as remaining plus net spend this cycle', () => {
      const spend: BuilderSpend[] = [
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

    it('a fractional spend never shrinks the pool or its default (gateway floors remaining)', () => {
      const spend: BuilderSpend[] = [{ userId: 'a', monthly: 0.26, addon: 0 }];
      const monthly = poolTotals(19_999, spend, 'monthly', null);

      expect(monthly.total).toBe(20_000);
      const builders = Array.from({ length: 10 }, (_, i) => member({ userId: `b${i}`, workspaceId: `ws-${i}` }));
      const r = resolveScopeLimits({
        pools: { monthly, addon: poolTotals(0, [], 'addon', null) },
        memberships: builders,
        limits: newScopeLimits(),
      });
      expect(r.byBuilder.get('b0')).toEqual({ monthly: 2000, addon: 0 });
    });
  });

  describe('resolveScopeLimits', () => {
    const pool = (total: number) => ({ total, remaining: total, used: 0, endsAt: null });

    it('splits the floored cycle-start pools among builders only', () => {
      const r = resolveScopeLimits({
        pools: { monthly: pool(900.6), addon: pool(30) },
        memberships: [
          member({ userId: 'b1' }),
          member({ userId: 'b2', activeMember: true, workspaceId: 'ws-b' }),
          member({ userId: 'end', canEdit: false }),
          member({ userId: 'gone', userArchived: true }),
        ],
        limits: newScopeLimits(),
      });

      expect([...r.byBuilder.keys()]).toEqual(['b1', 'b2']);
      expect(r.byBuilder.get('b1')).toEqual({ monthly: 450, addon: 15 });
    });
  });

  describe('toCreditsUsage', () => {
    const balance: GatewayBalance = {
      remaining: totals(900, 80),
      expiry: { recurringExpiryDate: '2026-11-01T00:00:00.000Z', topupExpiryDate: null },
      cycleStart: '2026-10-01T00:00:00.000Z',
    };

    it('falls back to the balance cycle start and omits workspaces on Cloud', () => {
      const result = toCreditsUsage({
        limitsAvailable: true,
        balance,
        usage: { cycleStart: null, trackingSince: null, spend: [{ userId: 'u1', monthly: 100, addon: 20 }] },
        memberships: [member()],
        workspaces: null,
      });

      expect(result.workspaces).toBeUndefined();
      expect(result).toMatchObject({
        cycle: { start: '2026-10-01T00:00:00.000Z', end: '2026-11-01T00:00:00.000Z' },
        pools: {
          monthly: { total: 1000, remaining: 900, used: 100, endsAt: '2026-11-01T00:00:00.000Z' },
          addon: { total: 100, remaining: 80, used: 20, endsAt: null },
        },
        trackingSince: null,
        rows: [
          {
            kind: 'builder',
            userId: 'u1',
            name: 'Priya Nair',
            email: 'priya@acme.io',
            // Limits on: logical split, all 120 within the monthly limit.
            monthly: 120,
            addon: 0,
            limit: { monthly: 1000, addon: 100 },
          },
        ],
        // No stored limits = a new scope: on.
        limits: { enabled: true, builderCount: 1 },
      });
    });

    it('includes workspaces and memberships on self-hosted', () => {
      const result = toCreditsUsage({
        limitsAvailable: true,
        balance,
        usage: { cycleStart: null, trackingSince: null, spend: [] },
        memberships: [member()],
        workspaces: [{ id: 'ws-a', name: 'Sales Ops' }],
      });

      expect(result.workspaces).toEqual([{ id: 'ws-a', name: 'Sales Ops' }]);
      expect(result.rows[0].workspaceIds).toEqual(['ws-a']);
    });
    it('limits on: builder rows show the logical split, the workspace breakdown follows it by share of spend', () => {
      const spend = [
        {
          userId: 'u1',
          monthly: 1700,
          addon: 340,
          byWorkspace: [
            { organizationId: 'ws-a', monthly: 1530, addon: 0 },
            { organizationId: 'ws-b', monthly: 170, addon: 340 },
          ],
        },
        { userId: 'end', monthly: 10, addon: 5 },
      ];
      const result = toCreditsUsage({
        limitsAvailable: true,
        balance: { ...balance, remaining: totals(6290, 1255) },
        usage: { cycleStart: null, trackingSince: null, spend },
        memberships: [
          member(),
          member({ userId: 'u2' }),
          member({ userId: 'u3' }),
          member({ userId: 'u4' }),
          member({ userId: 'end', canEdit: false }),
        ],
        workspaces: null,
        limits: { ...newScopeLimits(), enabled: true },
      });

      expect(result.pools.monthly).toMatchObject({ total: 8000, used: 1710 });
      expect(result.pools.addon).toMatchObject({ total: 1600, used: 345 });
      const [row] = result.rows;
      expect(row).toMatchObject({ userId: 'u1', monthly: 2000, addon: 40, limit: { monthly: 2000, addon: 400 } });
      // 2,040 spent: ws-a 1,530 (75%), ws-b 510 (25%), each split 2,000 : 40.
      expect(row.byWorkspace).toEqual([
        { organizationId: 'ws-a', monthly: 1500, addon: 30 },
        { organizationId: 'ws-b', monthly: 500, addon: 10 },
      ]);
      // No limit to split against: wallet split.
      expect(result.rows.find((r) => r.userId === 'end')).toMatchObject({ monthly: 10, addon: 5 });
    });

    it('limits on: the workspace breakdown sums exactly to the row (remainder on the largest share)', () => {
      const workspaceIds = ['ws-1', 'ws-2', 'ws-3', 'ws-4', 'ws-5', 'ws-6', 'ws-7'];
      const spend = [
        {
          userId: 'u1',
          monthly: 7,
          addon: 0,
          byWorkspace: workspaceIds.map((organizationId) => ({ organizationId, monthly: 1, addon: 0 })),
        },
      ];
      const result = toCreditsUsage({
        limitsAvailable: true,
        balance: { ...balance, remaining: totals(900, 1000) },
        usage: { cycleStart: null, trackingSince: null, spend },
        memberships: [member()],
        workspaces: null,
        limits: { ...newScopeLimits(), enabled: true, custom: new Map([['u1', { monthly: 1, addon: 400 }]]) },
      });

      const [row] = result.rows;
      expect(row).toMatchObject({ monthly: 1, addon: 6 });
      const sum = sumRows(row.byWorkspace);
      expect(sum.monthly).toBeCloseTo(1, 10);
      expect(sum.addon).toBeCloseTo(6, 10);
      for (const w of row.byWorkspace) {
        expect(Math.round(w.monthly * 100) / 100).toBe(w.monthly);
        expect(Math.round(w.addon * 100) / 100).toBe(w.addon);
      }
    });

    it('limits off: builder rows keep the wallet split', () => {
      const result = toCreditsUsage({
        limitsAvailable: true,
        balance,
        usage: { cycleStart: null, trackingSince: null, spend: [{ userId: 'u1', monthly: 1700, addon: 340 }] },
        memberships: [member()],
        workspaces: null,
        limits: { ...newScopeLimits(), enabled: false },
      });
      expect(result.rows[0]).toMatchObject({ monthly: 1700, addon: 340 });
    });
  });
  describe('toMyCredits', () => {
    const balance = (monthly: number, addon: number): GatewayBalance => ({
      remaining: totals(monthly, addon),
      expiry: { recurringExpiryDate: '2026-11-01T00:00:00.000Z', topupExpiryDate: '2027-08-02T00:00:00.000Z' },
      cycleStart: '2026-10-01T00:00:00.000Z',
    });
    const usage = (spend: Record<string, [number, number]>) =>
      toBuilderUsage({
        cycleStart: '2026-10-01T00:00:00.000Z',
        users: Object.entries(spend).map(([userId, [r, t]]) => ({ userId, ...totals(r, t) })),
        unattributed: totals(0),
        pool: totals(0),
      });
    const on = () => ({ ...newScopeLimits(), enabled: true });
    const builders = [member({ userId: 'a' }), member({ userId: 'b' })];

    it('limits on: own used, limit and left per pool with dates', () => {
      // pools 1000/200 at cycle start → 500/100 each
      const r = toMyCredits({
        balance: balance(1000 - 450, 200),
        usage: usage({ a: [400, 0], b: [50, 0] }),
        memberships: builders,
        limits: on(),
        userId: 'a',
      });

      expect(r).toEqual({
        enabled: true,
        cycleStart: '2026-10-01T00:00:00.000Z',
        monthly: { used: 400, limit: 500, left: 100, renewsOn: '2026-11-01T00:00:00.000Z' },
        addon: { used: 0, limit: 100, left: 100, expiresOn: '2027-08-02T00:00:00.000Z' },
      });
    });

    it('splits logically: monthly spend past the monthly limit counts as add-on, overshoot stays visible', () => {
      const r = toMyCredits({
        balance: balance(1000 - 650, 200),
        usage: usage({ a: [650, 0] }),
        memberships: builders,
        limits: on(),
        userId: 'a',
      });

      expect(r.enabled && [r.monthly, r.addon]).toEqual([
        { used: 500, limit: 500, left: 0, renewsOn: '2026-11-01T00:00:00.000Z' },
        { used: 150, limit: 100, left: 0, expiresOn: '2027-08-02T00:00:00.000Z' },
      ]);
    });

    it('limits off → disabled', () => {
      expect(
        toMyCredits({
          balance: balance(1000, 200),
          usage: usage({}),
          memberships: builders,
          limits: { ...newScopeLimits(), enabled: false },
          userId: 'a',
        })
      ).toEqual({ enabled: false });
    });

    it('not a builder in scope → disabled', () => {
      expect(
        toMyCredits({
          balance: balance(1000, 200),
          usage: usage({}),
          memberships: [...builders, member({ userId: 'end', canEdit: false })],
          limits: on(),
          userId: 'end',
        })
      ).toEqual({ enabled: false });
    });
  });
});
