import { DataQueriesUtilService } from '@modules/data-queries/util.service';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { DataSource } from '@entities/data_source.entity';
import { Response } from 'express';
import * as util from '@modules/data-queries/library/library-query.util';

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

describe('explicit library references', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  const queryId = '22222222-2222-4222-8222-222222222222';
  it.each([undefined, null, '', 'draft', 'bad'])('rejects missing or sentinel reference %p', (value) => {
    expect(() => util.parseLibraryReference({ libraryQueryVersionId: value })).toThrow();
  });
  it('accepts only one explicit UUID reference', () => {
    expect(util.parseLibraryReference({ libraryQueryVersionId: id })).toEqual({ id });
    expect(() => util.parseLibraryReference({ libraryQueryVersionId: id, draftId: id })).toThrow();
  });
  it('resolves saved first using the query scope and preserves a saved name of draft', async () => {
    const snapshot = { id, libraryQueryId: queryId, name: 'draft', options: { code: 'saved' } };
    const manager = { findOne: jest.fn().mockResolvedValue(snapshot) };
    expect(await util.resolveLibraryReference(queryId, id, manager as never)).toEqual({ kind: 'saved', snapshot });
    expect(manager.findOne).toHaveBeenCalledWith(expect.anything(), { where: { id, libraryQueryId: queryId } });
  });
  it('resolves the exact draft UUID without selecting another draft', async () => {
    const snapshot = { id, libraryQueryId: queryId, name: 'B', options: { code: 'B' } };
    const manager = { findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(snapshot) };
    expect(await util.resolveLibraryReference(queryId, id, manager as never)).toEqual({ kind: 'draft', snapshot });
    expect(manager.findOne).toHaveBeenLastCalledWith(expect.anything(), { where: { id, libraryQueryId: queryId } });
  });
  it('resolves the same saved UUID when saving commits between the first two reads', async () => {
    const snapshot = { id, libraryQueryId: queryId, name: 'saved-B', options: { code: 'B' } };
    const manager = {
      findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(snapshot),
    };
    expect(await util.resolveLibraryReference(queryId, id, manager as never)).toEqual({ kind: 'saved', snapshot });
    expect(manager.findOne).toHaveBeenNthCalledWith(3, expect.anything(), { where: { id, libraryQueryId: queryId } });
  });
  it('rejects unknown, deleted or cross-query UUIDs', async () => {
    await expect(
      util.resolveLibraryReference(queryId, id, { findOne: jest.fn().mockResolvedValue(null) } as never)
    ).rejects.toThrow();
  });
  it('uses identity and status for release and promotion even when the saved name is draft', () => {
    const pin = {
      consumerQueryName: 'consumer',
      libraryQueryName: 'query',
      pinnedVersion: 'draft',
      pinnedVersionId: id,
      releasedVersionId: id,
      status: 'saved' as const,
      releasedVersion: 'draft',
      pinnedEnvironment: { name: 'production', priority: 3 },
    };
    expect(util.libraryReleaseBlock([pin])).toBeNull();
    expect(util.libraryPromoteBlock([pin], 'production', 3)).toBeNull();
    expect(util.libraryReleaseBlock([{ ...pin, status: 'draft' }])).not.toBeNull();
    expect(util.libraryPromoteBlock([{ ...pin, status: 'draft' }], 'production', 3)).not.toBeNull();
    expect(util.libraryReleaseBlock([{ ...pin, releasedVersionId: queryId }])).not.toBeNull();
  });
});
