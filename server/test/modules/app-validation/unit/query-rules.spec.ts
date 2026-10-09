import { toIndexData, toQueryWrites } from '@modules/app-validation/export-reader';
import {
  queryBodyNotEmpty,
  queryDataSourceValid,
  queryDeleteStillUsed,
  queryNameFormat,
  queryNameUnique,
  queryRules,
} from '@modules/app-validation/rules/query.rules';
import { runRules } from '@modules/app-validation/runner';
import { QueryWrite, RuleContext } from '@modules/app-validation/types';
import { VersionIndex } from '@modules/app-validation/version-index';
import { templateAppVersions } from '../helpers/templates';

const index = VersionIndex.fromData({
  queries: [
    { id: 'q1', name: 'getUsers', dataSourceId: 'ds1' },
    { id: 'q2', name: 'updateUser', dataSourceId: 'ds1' },
  ],
  events: [
    { id: 'e1', sourceId: 'c1', target: 'component', index: 0, eventId: 'onClick', actionId: 'run-query', refId: 'q1' },
  ],
  dataSources: [
    { id: 'ds1', kind: 'postgresql', scope: 'global', organizationId: 'org1' },
    { id: 'ds2', kind: 'runjs', scope: 'local' },
  ],
});
const ctx: RuleContext = { appVersionId: 'v1', source: 'pat', index: async () => index };

const write = (overrides: Partial<QueryWrite> = {}): QueryWrite => ({
  op: 'create',
  id: 'new',
  data: { name: 'getOrders', kind: 'postgresql', dataSourceId: 'ds1', options: {} },
  ...overrides,
});

describe('query rules', () => {
  describe('query-name-format', () => {
    it('rejects names that code cannot reference', () => {
      expect(queryNameFormat.check(write({ data: { ...write().data, name: 'get orders!' } }), ctx)).toEqual([
        expect.objectContaining({ code: 'QUERY_NAME_INVALID', severity: 'high', confidence: 'certain' }),
      ]);
    });

    it('accepts identifier-like names and untouched updates', () => {
      expect(queryNameFormat.check(write(), ctx)).toEqual([]);
      expect(
        queryNameFormat.check(write({ op: 'update', id: 'q1', data: { name: 'bad name' }, touched: ['options'] }), ctx)
      ).toEqual([]);
    });
  });

  describe('query-name-unique', () => {
    it('rejects a name another query of the version already uses', async () => {
      expect(await queryNameUnique.check(write({ data: { ...write().data, name: 'getUsers' } }), ctx)).toEqual([
        expect.objectContaining({ code: 'QUERY_NAME_TAKEN', severity: 'high' }),
      ]);
    });

    it('lets a query keep its own name on update', async () => {
      expect(
        await queryNameUnique.check(
          write({ op: 'update', id: 'q1', data: { name: 'getUsers' }, touched: ['name'] }),
          ctx
        )
      ).toEqual([]);
    });
  });

  describe('query-datasource-valid', () => {
    it('rejects a data source that is not reachable from this version', async () => {
      expect(await queryDataSourceValid.check(write({ data: { ...write().data, dataSourceId: 'nope' } }), ctx)).toEqual(
        [expect.objectContaining({ code: 'QUERY_DATASOURCE_NOT_FOUND', severity: 'high', confidence: 'certain' })]
      );
    });

    it('rejects creating a query whose kind does not match the data source', async () => {
      expect(await queryDataSourceValid.check(write({ data: { ...write().data, kind: 'restapi' } }), ctx)).toEqual([
        expect.objectContaining({ code: 'QUERY_KIND_MISMATCH', severity: 'high', confidence: 'certain' }),
      ]);
    });

    it('only warns when an existing query moves across kinds, which workflows do', async () => {
      expect(
        await queryDataSourceValid.check(
          write({
            op: 'update',
            id: 'q1',
            data: { kind: 'postgresql', dataSourceId: 'ds2' },
            touched: ['dataSourceId'],
          }),
          ctx
        )
      ).toEqual([
        expect.objectContaining({ code: 'QUERY_KIND_MISMATCH', severity: 'medium', confidence: 'heuristic' }),
      ]);
    });

    it('skips when exports carry no kind', async () => {
      expect(
        await queryDataSourceValid.check(write({ data: { name: 'q', dataSourceId: 'ds1', options: {} } }), ctx)
      ).toEqual([]);
    });
  });

  describe('query-body-not-empty', () => {
    it('reports an empty JavaScript body', async () => {
      expect(
        await queryBodyNotEmpty.check(
          write({ data: { name: 'calc', kind: 'runjs', dataSourceId: 'ds2', options: { code: '  ' } } }),
          ctx
        )
      ).toEqual([expect.objectContaining({ code: 'QUERY_EMPTY_CODE', severity: 'info' })]);
    });

    it('resolves the kind through the data source when the write has none', async () => {
      expect(
        await queryBodyNotEmpty.check(
          write({ data: { name: 'calc', dataSourceId: 'ds2', options: { code: '' } } }),
          ctx
        )
      ).toEqual([expect.objectContaining({ code: 'QUERY_EMPTY_CODE' })]);
    });

    it('says nothing about other kinds or filled bodies', async () => {
      expect(await queryBodyNotEmpty.check(write({ data: { ...write().data, options: { code: '' } } }), ctx)).toEqual(
        []
      );
      expect(
        await queryBodyNotEmpty.check(
          write({ data: { name: 'calc', kind: 'runjs', dataSourceId: 'ds2', options: { code: 'return 1' } } }),
          ctx
        )
      ).toEqual([]);
    });
  });

  describe('query-delete-still-used', () => {
    it('reports handlers that still run the deleted query', async () => {
      expect(await queryDeleteStillUsed.check({ op: 'delete', id: 'q1', data: { name: 'getUsers' } }, ctx)).toEqual([
        expect.objectContaining({ code: 'QUERY_DELETE_IN_USE', severity: 'medium' }),
      ]);
    });

    it('stays silent when nothing points at the query', async () => {
      expect(await queryDeleteStillUsed.check({ op: 'delete', id: 'q2', data: { name: 'updateUser' } }, ctx)).toEqual(
        []
      );
    });
  });

  // Calibration: ToolJet ships these templates, so no query rule may block their import.
  it('finds no blocking problem in any ToolJet template', async () => {
    const errors = [];
    for (const version of templateAppVersions()) {
      const versionCtx: RuleContext = {
        appVersionId: version.appVersionId,
        appType: version.appType,
        source: 'import',
        index: async () => VersionIndex.fromData(toIndexData(version)),
      };
      const result = await runRules(queryRules, toQueryWrites(version), versionCtx);
      errors.push(...result.errors);
    }
    expect(errors).toEqual([]);
  });
});
