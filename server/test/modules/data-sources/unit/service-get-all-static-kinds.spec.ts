/**
 * Regression: GET /data-sources/:organizationId (the Data Sources page list) must not return built-in
 * (static) kinds. They have no plugin manifest, so a stray `default`-type row of one crashed the page.
 * `restapi` is also a built-in kind but ships a manifest and is a legitimate user-created source — it stays.
 */
import { DataSourcesService } from '../../../../src/modules/data-sources/service';

const row = (kind: string, type: string) => ({ id: `${kind}-${type}`, name: kind, kind, type, options: {} });

describe('DataSourcesService.getAll — built-in kinds', () => {
  const buildService = (rows: object[]) => {
    const repository = { allGlobalDS: jest.fn().mockResolvedValue(rows) };
    const service = new DataSourcesService(repository as any, null, null, null, null);
    return service.getAll({ environmentId: 'env-1' } as any, { organizationId: 'org-1' } as any, {} as any);
  };

  it('omits default-type rows of kinds without a plugin manifest', async () => {
    const { data_sources } = await buildService([
      row('runjs', 'default'),
      row('runpy', 'default'),
      row('tooljetdb', 'default'),
      row('workflows', 'default'),
      row('postgresql', 'default'),
    ]);

    expect(data_sources).toMatchObject([{ kind: 'postgresql' }]);
  });

  it('keeps restapi and the sample data source', async () => {
    const { data_sources } = await buildService([row('restapi', 'default'), row('postgresql', 'sample')]);

    expect(data_sources.map((d: any) => d.kind)).toEqual(['restapi', 'postgresql']);
  });
});
