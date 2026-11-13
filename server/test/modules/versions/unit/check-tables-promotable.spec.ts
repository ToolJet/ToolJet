import { BadRequestException } from '@nestjs/common';
import { VersionUtilService } from '@modules/versions/util.service';

// The promote block names the tables a target environment is missing, with their ids, so the client can promote
// them (structure only) and retry instead of only reading a message.
describe('VersionUtilService.checkTablesPromotableToEnvironment', () => {
  const build = (resolvedIds: string[]) => {
    const service = Object.create(VersionUtilService.prototype) as any;
    service.logger = { error: jest.fn() };
    service.appsUtilService = {
      findTooljetDbTables: jest.fn().mockResolvedValue([{ table_id: 't-1' }, { table_id: 't-2' }]),
    };
    service.relationResolverService = {
      resolve: jest.fn().mockResolvedValue(new Map(resolvedIds.map((id) => [id, `rel-${id}`]))),
    };
    const manager = {
      find: jest.fn().mockResolvedValue([
        { id: 't-1', tableName: 'vendors' },
        { id: 't-2', tableName: 'activity' },
      ]),
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
      { id: 't-1', name: 'vendors' },
      { id: 't-2', name: 'activity' },
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
    manager.find.mockResolvedValue([{ id: 't-1', tableName: 'vendors' }]);
    const { offenders } = await service.findTablesMissingInEnvironment('app-1', 'v-1', 'env-staging', 'org-1', manager);
    expect(offenders.map((t) => t.tableName)).toEqual(['vendors']);
  });
});
