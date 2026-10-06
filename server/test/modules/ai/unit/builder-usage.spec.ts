import {
  BuilderSpend,
  GatewayBalance,
  Membership,
  classifyPerson,
  joinUsageToPeople,
  poolTotals,
  toBuilderUsage,
  toCreditsUsage,
} from '@ee/ai/services/builder-usage.service';

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
  });

  describe('toCreditsUsage', () => {
    const balance: GatewayBalance = {
      remaining: totals(900, 80),
      expiry: { recurringExpiryDate: '2026-11-01T00:00:00.000Z', topupExpiryDate: null },
      cycleStart: '2026-10-01T00:00:00.000Z',
    };

    it('falls back to the balance cycle start and omits workspaces on Cloud', () => {
      const result = toCreditsUsage({
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
            monthly: 100,
            addon: 20,
            limit: { monthly: 1000, addon: 100 },
          },
        ],
        limits: { enabled: false, builderCount: 1 },
      });
    });

    it('includes workspaces and memberships on self-hosted', () => {
      const result = toCreditsUsage({
        balance,
        usage: { cycleStart: null, trackingSince: null, spend: [] },
        memberships: [member()],
        workspaces: [{ id: 'ws-a', name: 'Sales Ops' }],
      });

      expect(result.workspaces).toEqual([{ id: 'ws-a', name: 'Sales Ops' }]);
      expect(result.rows[0].workspaceIds).toEqual(['ws-a']);
    });
  });
});
