import { BadRequestException } from '@nestjs/common';
import { VersionUtilService } from '@modules/versions/util.service';
import { InternalTable } from '@entities/internal_table.entity';
import { findUnpromotedReferences } from '@modules/tooljet-db/services/tooljet-db-promote.service';

jest.mock('@modules/tooljet-db/services/tooljet-db-promote.service', () => ({
  ...jest.requireActual('@modules/tooljet-db/services/tooljet-db-promote.service'),
  findUnpromotedReferences: jest.fn(),
}));

const mockedReferences = findUnpromotedReferences as jest.Mock;

// The promote block names the tables a target environment is missing, with their ids, so the client can promote
// them (structure only) and retry instead of only reading a message.
describe('VersionUtilService.checkTablesPromotableToEnvironment', () => {
  const tableRows: Record<string, { id: string; tableName: string }> = {
    't-1': { id: 't-1', tableName: 'vendors' },
    't-2': { id: 't-2', tableName: 'activity' },
    'p-1': { id: 'p-1', tableName: 'parents' },
  };

  beforeEach(() => {
    mockedReferences.mockReset().mockResolvedValue([]);
  });

  // `resolvedIds` are the tables that already have a relation in the target; the source has every table.
  const build = (resolvedIds: string[]) => {
    const service = Object.create(VersionUtilService.prototype) as any;
    service.logger = { error: jest.fn() };
    service.appsUtilService = {
      findTooljetDbTables: jest.fn().mockResolvedValue([{ table_id: 't-1' }, { table_id: 't-2' }]),
    };
    service.relationResolverService = {
      resolve: jest.fn(async (_org: string, ids: string[], environmentId: string) =>
        environmentId === 'env-staging'
          ? new Map(resolvedIds.map((id) => [id, `rel-${id}`]))
          : new Map(ids.map((id) => [id, `src-${id}`]))
      ),
    };
    const manager = {
      find: jest.fn(async (entity: unknown, options: { where: { id: { value: string[] } } }) => {
        const ids = options.where.id.value;
        return entity === InternalTable
          ? ids.map((id) => tableRows[id])
          : ids.map((id) => ({ id, branchId: 'branch-1' }));
      }),
    };
    return { service, manager };
  };

  it('lists the missing tables with their ids and a code the client can act on', async () => {
    const { service, manager } = build([]);
    const error = await service
      .checkTablesPromotableToEnvironment('app-1', 'v-1', 'env-staging', 'staging', 'env-dev', 'org-1', manager)
      .catch((e) => e);
    expect(error).toBeInstanceOf(BadRequestException);
    const body = (error as BadRequestException).getResponse() as any;
    expect(body.message.code).toBe('TABLES_NOT_IN_TARGET_ENVIRONMENT');
    expect(body.message.tables).toEqual([
      { id: 't-1', name: 'vendors', needed_by_app: true, depends_on: [] },
      { id: 't-2', name: 'activity', needed_by_app: true, depends_on: [] },
    ]);
    expect(body.message.error).toContain('2 tables not available in staging');
  });

  it('does not block when every table resolves in the target', async () => {
    const { service, manager } = build(['t-1', 't-2']);
    service.findTablesBehindTarget = jest.fn().mockResolvedValue([]);
    await expect(
      service.checkTablesPromotableToEnvironment('app-1', 'v-1', 'env-staging', 'staging', 'env-dev', 'org-1', manager)
    ).resolves.toEqual({ warnings: [] });
  });

  it('names the missing tables without throwing, for the promote dialog to show on open', async () => {
    const { service, manager } = build(['t-2']);
    const { offenders } = await service.findTablesMissingInEnvironment(
      'app-1',
      'v-1',
      'env-staging',
      'env-dev',
      'org-1',
      manager
    );
    expect(offenders.map((t) => t.tableName)).toEqual(['vendors']);
  });

  describe('a missing table that references a table the target does not have either', () => {
    // vendors (queried) references parents (not queried): parents has to reach the target first.
    const vendorsNeedParents = () =>
      mockedReferences.mockImplementation(async (_org: string, table: { id: string }) =>
        table.id === 't-1' ? [tableRows['p-1']] : []
      );

    it('lists the referenced table too, parents first, and says the app does not read it', async () => {
      vendorsNeedParents();
      const { service, manager } = build(['t-2']);
      const { promotable } = await service.findTablesMissingInEnvironment(
        'app-1',
        'v-1',
        'env-staging',
        'env-dev',
        'org-1',
        manager
      );
      expect(promotable).toEqual([
        { table: tableRows['p-1'], neededByApp: false, dependsOn: [] },
        { table: tableRows['t-1'], neededByApp: true, dependsOn: ['p-1'] },
      ]);
    });

    it('lists it in the promote block, still counting only the tables the app queries', async () => {
      vendorsNeedParents();
      const { service, manager } = build(['t-2']);
      const error = await service
        .checkTablesPromotableToEnvironment('app-1', 'v-1', 'env-staging', 'staging', 'env-dev', 'org-1', manager)
        .catch((e) => e);
      const body = (error as BadRequestException).getResponse() as any;
      expect(body.message.error).toBe(
        'Promote blocked - table "vendors" not available in staging. Promote the table first.'
      );
      expect(body.message.tables).toEqual([
        { id: 'p-1', name: 'parents', needed_by_app: false, depends_on: [] },
        { id: 't-1', name: 'vendors', needed_by_app: true, depends_on: ['p-1'] },
      ]);
    });

    it('finds a referenced table that is only reachable through another referenced table', async () => {
      mockedReferences.mockImplementation(async (_org: string, table: { id: string }) =>
        table.id === 't-1' ? [tableRows['p-1']] : table.id === 'p-1' ? [tableRows['t-2']] : []
      );
      const { service, manager } = build([]);
      service.appsUtilService.findTooljetDbTables.mockResolvedValue([{ table_id: 't-1' }]);
      const { promotable } = await service.findTablesMissingInEnvironment(
        'app-1',
        'v-1',
        'env-staging',
        'env-dev',
        'org-1',
        manager
      );
      expect(promotable.map(({ table }) => table.id)).toEqual(['t-2', 'p-1', 't-1']);
      expect(promotable.map(({ dependsOn }) => dependsOn)).toEqual([[], ['t-2'], ['p-1']]);
    });
  });
});
