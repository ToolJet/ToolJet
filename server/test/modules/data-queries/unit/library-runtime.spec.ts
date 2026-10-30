import { DataQueriesUtilService } from '@modules/data-queries/util.service';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { DataSource } from '@entities/data_source.entity';
import { Response } from 'express';

jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn(() => {
    throw new Error('Unexpected app/version lookup');
  }),
}));

/** @group platform */
describe('DataQueriesUtilService library execution', () => {
  const user = { id: 'user', organizationId: 'workspace' } as User;
  const source = { id: 'source', kind: 'postgresql' } as DataSource;
  const fixture = () => {
    const options = jest.fn().mockResolvedValue({ id: 'options', environmentId: 'environment', options: {} });
    const runtime = new DataQueriesUtilService(
      {} as never,
      { get: () => 'false' } as never,
      { getOptions: options } as never,
      { resolveOAuthRedirectHost: async () => 'localhost' } as never,
      {} as never
    );
    jest.spyOn(runtime, 'fetchServiceAndParsedParams').mockResolvedValue({
      sourceOptions: {},
      parsedQueryOptions: {},
      service: { run: jest.fn().mockResolvedValue({ status: 'ok', data: [1] }) },
    });
    return { runtime, options };
  };
  it('should use workspace context without loading an app or app version for editor runs', async () => {
    const { runtime, options } = fixture();
    const query = { id: 'library', name: 'Customers', dataSource: source, appVersionId: 'never-load' };
    const result = await runtime.runQuery(user, query, {}, {} as Response, 'environment', 'library', undefined, {
      library: { standalone: { organizationId: user.organizationId, name: query.name } },
    });
    expect(result).toMatchObject({ status: 'ok', data: [1] });
    expect(options).toHaveBeenCalledWith(source.id, user.organizationId, 'environment', undefined);
  });
  it('should use default branch credentials while retaining consumer version metadata', async () => {
    const { runtime, options } = fixture();
    const appVersion = { id: 'consumer-version', branchId: 'consumer-branch', appName: 'Consumer', isPublic: false };
    const query = { id: 'consumer', name: 'Customers', dataSource: source, appVersionId: appVersion.id, appVersion };
    await runtime.runQuery(
      user,
      query,
      {},
      {} as Response,
      'environment',
      'view',
      {
        id: 'app',
        organizationId: user.organizationId,
      } as App,
      { library: {} }
    );
    expect(options).toHaveBeenCalledWith(source.id, user.organizationId, 'environment', undefined);
    expect(query.appVersion).toBe(appVersion);
  });
});
