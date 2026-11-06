/// <reference types="jest" />
import {
  buildConstantsPage,
  mergeConstantRows,
  toEnvironmentConstantRow,
  toWorkspaceConstantRow,
  ConstantListRow,
  ConstantsPageQuery,
} from '@modules/organization-constants/helpers/constants-list';
import { ConstantListSort, ConstantSource, OrganizationConstantType } from '@modules/organization-constants/constants';
import { ConstantWithEnvironmentValues } from '@modules/organization-constants/types';

const GLOBAL = OrganizationConstantType.GLOBAL;
const SECRET = OrganizationConstantType.SECRET;

const row = (overrides: Partial<ConstantListRow> & { name: string }): ConstantListRow => ({
  id: `id-${overrides.name}`,
  type: GLOBAL,
  source: ConstantSource.WORKSPACE,
  value: 'v',
  environmentIdsWithValue: ['env-1'],
  lastModifiedAt: new Date('2026-01-01T00:00:00Z'),
  owner: null,
  modifiedBy: null,
  ...overrides,
});

const query = (overrides: Partial<ConstantsPageQuery> = {}): ConstantsPageQuery => ({
  type: GLOBAL,
  search: undefined,
  sources: [ConstantSource.WORKSPACE, ConstantSource.ENV],
  sort: ConstantListSort.NAME_ASC,
  page: 1,
  perPage: 50,
  ...overrides,
});

const names = (rows: ConstantListRow[]) => rows.map((r) => r.name);

/** @group platform */
describe('constants list calculation', () => {
  describe('buildConstantsPage', () => {
    describe('type and counts', () => {
      it('should return only the active type in items and total, and count both types', () => {
        const rows = [row({ name: 'g1' }), row({ name: 'g2' }), row({ name: 's1', type: SECRET })];

        const result = buildConstantsPage(rows, query({ type: SECRET }));

        expect(names(result.items)).toEqual(['s1']);
        expect(result.total).toBe(1);
        expect(result.counts).toEqual({ secrets: 1, globals: 2 });
      });
    });

    describe('search', () => {
      it('should match a case-insensitive substring of the name', () => {
        const rows = [row({ name: 'Api_Key' }), row({ name: 'base_url' }), row({ name: 'rapid' })];

        const result = buildConstantsPage(rows, query({ search: 'API' }));

        expect(names(result.items)).toEqual(['Api_Key', 'rapid']);
        expect(result.total).toBe(2);
      });

      it('should make counts follow the search across both types', () => {
        const rows = [
          row({ name: 'api_g' }),
          row({ name: 'other_g' }),
          row({ name: 'api_s', type: SECRET }),
          row({ name: 'api_s2', type: SECRET }),
          row({ name: 'other_s', type: SECRET }),
        ];

        const result = buildConstantsPage(rows, query({ search: 'api' }));

        expect(result.counts).toEqual({ secrets: 2, globals: 1 });
      });

      it('should treat a blank search as no search', () => {
        const rows = [row({ name: 'a' }), row({ name: 'b' })];

        expect(buildConstantsPage(rows, query({ search: '' })).total).toBe(2);
      });
    });

    describe('source filter', () => {
      const rows = [
        row({ name: 'db_one' }),
        row({ name: 'env_one', source: ConstantSource.ENV }),
        row({ name: 'env_secret', source: ConstantSource.ENV, type: SECRET }),
      ];

      it('should keep only workspace rows when source is workspace', () => {
        const result = buildConstantsPage(rows, query({ sources: [ConstantSource.WORKSPACE] }));

        expect(names(result.items)).toEqual(['db_one']);
        expect(result.counts).toEqual({ secrets: 0, globals: 1 });
      });

      it('should keep only env rows when source is env, and count them', () => {
        const result = buildConstantsPage(rows, query({ sources: [ConstantSource.ENV] }));

        expect(names(result.items)).toEqual(['env_one']);
        expect(result.counts).toEqual({ secrets: 1, globals: 1 });
      });

      it('should keep both sources when both are listed', () => {
        const result = buildConstantsPage(rows, query());

        expect(names(result.items)).toEqual(['db_one', 'env_one']);
      });
    });

    describe('name sort', () => {
      it('should sort ascending, ignoring case', () => {
        const rows = [row({ name: 'banana' }), row({ name: 'Apple' }), row({ name: 'cherry' })];

        expect(names(buildConstantsPage(rows, query()).items)).toEqual(['Apple', 'banana', 'cherry']);
      });

      it('should sort descending, ignoring case', () => {
        const rows = [row({ name: 'banana' }), row({ name: 'Apple' }), row({ name: 'cherry' })];

        const result = buildConstantsPage(rows, query({ sort: ConstantListSort.NAME_DESC }));

        expect(names(result.items)).toEqual(['cherry', 'banana', 'Apple']);
      });

      it('should break name ties by id so the order is stable', () => {
        const rows = [row({ name: 'dup', id: 'b' }), row({ name: 'DUP', id: 'a' })];

        const asc = buildConstantsPage(rows, query());
        const desc = buildConstantsPage(rows, query({ sort: ConstantListSort.NAME_DESC }));

        expect(asc.items.map((r) => r.id)).toEqual(['a', 'b']);
        expect(desc.items.map((r) => r.id)).toEqual(['a', 'b']);
      });
    });

    describe('modified sort', () => {
      const old = new Date('2026-01-01T00:00:00Z');
      const recent = new Date('2026-03-01T00:00:00Z');
      const rows = [
        row({ name: 'legacy', lastModifiedAt: null }),
        row({ name: 'old', lastModifiedAt: old }),
        row({ name: 'env', source: ConstantSource.ENV, lastModifiedAt: null }),
        row({ name: 'recent', lastModifiedAt: recent }),
      ];

      it('should put the most recent first on modified_desc, with null dates last', () => {
        const result = buildConstantsPage(rows, query({ sort: ConstantListSort.MODIFIED_DESC }));

        expect(names(result.items)).toEqual(['recent', 'old', 'env', 'legacy']);
      });

      it('should put the oldest first on modified_asc, with null dates still last', () => {
        const result = buildConstantsPage(rows, query({ sort: ConstantListSort.MODIFIED_ASC }));

        expect(names(result.items)).toEqual(['old', 'recent', 'env', 'legacy']);
      });

      it('should break equal dates by name ascending in both directions', () => {
        const same = [row({ name: 'zed', lastModifiedAt: old }), row({ name: 'alpha', lastModifiedAt: old })];

        for (const sort of [ConstantListSort.MODIFIED_ASC, ConstantListSort.MODIFIED_DESC]) {
          expect(names(buildConstantsPage(same, query({ sort })).items)).toEqual(['alpha', 'zed']);
        }
      });
    });

    describe('paging', () => {
      const rows = ['a', 'b', 'c', 'd', 'e'].map((name) => row({ name }));

      it('should return the first page', () => {
        const result = buildConstantsPage(rows, query({ page: 1, perPage: 2 }));

        expect(names(result.items)).toEqual(['a', 'b']);
        expect(result.total).toBe(5);
      });

      it('should return a short last page', () => {
        const result = buildConstantsPage(rows, query({ page: 3, perPage: 2 }));

        expect(names(result.items)).toEqual(['e']);
        expect(result.total).toBe(5);
      });

      it('should return no items but the right total beyond the last page', () => {
        const result = buildConstantsPage(rows, query({ page: 4, perPage: 2 }));

        expect(result.items).toEqual([]);
        expect(result.total).toBe(5);
        expect(result.counts).toEqual({ secrets: 0, globals: 5 });
      });
    });

    it('should not mutate its input', () => {
      const rows = [row({ name: 'b' }), row({ name: 'a' })];

      buildConstantsPage(rows, query());

      expect(names(rows)).toEqual(['b', 'a']);
    });
  });

  describe('mergeConstantRows', () => {
    it('should hide a workspace row that shares name and type with an env row', () => {
      const workspace = [row({ name: 'x' }), row({ name: 'x', type: SECRET }), row({ name: 'y' })];
      const env = [row({ name: 'x', source: ConstantSource.ENV })];

      const merged = mergeConstantRows(workspace, env);

      expect(merged.map((r) => `${r.source}:${r.type}:${r.name}`)).toEqual(
        expect.arrayContaining(['env:Global:x', 'workspace:Secret:x', 'workspace:Global:y'])
      );
      expect(merged).toHaveLength(3);
    });
  });

  describe('toWorkspaceConstantRow', () => {
    const baseRecord = {
      id: 'c1',
      constantName: 'api_key',
      type: GLOBAL,
      updatedAt: new Date('2026-02-02T00:00:00Z'),
      orgEnvironmentConstantValues: [
        { environmentId: 'env-1', value: 'enc-1' },
        { environmentId: 'env-2', value: '' },
        { environmentId: 'env-3', value: 'enc-3' },
      ],
      createdByUser: { id: 'u1', firstName: 'Ada', lastName: 'Lovelace' },
      updatedByUser: { id: 'u2', firstName: 'Grace', lastName: '' },
    };

    it('should map the selected environment value, users and modified date', () => {
      expect(toWorkspaceConstantRow(baseRecord, 'env-1')).toEqual({
        id: 'c1',
        name: 'api_key',
        type: GLOBAL,
        source: ConstantSource.WORKSPACE,
        value: 'enc-1',
        environmentIdsWithValue: ['env-1', 'env-3'],
        lastModifiedAt: baseRecord.updatedAt,
        owner: { id: 'u1', name: 'Ada Lovelace' },
        modifiedBy: { id: 'u2', name: 'Grace' },
      });
    });

    it('should return null when the constant has no value in the selected environment', () => {
      expect(toWorkspaceConstantRow(baseRecord, 'env-2')).toBeNull();
      expect(toWorkspaceConstantRow(baseRecord, 'env-unknown')).toBeNull();
    });

    it('should map missing users to null', () => {
      const row = toWorkspaceConstantRow({ ...baseRecord, createdByUser: null, updatedByUser: null }, 'env-1');

      expect(row).toMatchObject({ owner: null, modifiedBy: null });
    });
  });

  describe('toEnvironmentConstantRow', () => {
    const envConstant = (overrides: Partial<ConstantWithEnvironmentValues>): ConstantWithEnvironmentValues => ({
      id: 'random-uuid',
      name: 'API_URL',
      type: GLOBAL,
      createdAt: '2026-01-01T00:00:00.000Z',
      values: [
        { environmentName: 'development', value: 'http://dev', id: 'env-1' },
        { environmentName: 'staging', value: '', id: 'env-2' },
      ],
      fromEnv: true,
      ...overrides,
    });

    it('should use a synthetic id, the env source, the plaintext Global value and no audit fields', () => {
      expect(toEnvironmentConstantRow(envConstant({}), 'env-1')).toEqual({
        id: 'env:Global:API_URL',
        name: 'API_URL',
        type: GLOBAL,
        source: ConstantSource.ENV,
        value: 'http://dev',
        environmentIdsWithValue: ['env-1'],
        lastModifiedAt: null,
        owner: null,
        modifiedBy: null,
      });
    });

    it('should never carry a Secret value', () => {
      const secret = envConstant({
        type: SECRET,
        values: [{ environmentName: 'development', value: 'plaintext-secret', id: 'env-1' }],
      });

      const result = toEnvironmentConstantRow(secret, 'env-1');

      expect(result.value).toBeNull();
      expect(JSON.stringify(result)).not.toContain('plaintext-secret');
    });

    it('should return null when the env constant has no value in the selected environment', () => {
      expect(toEnvironmentConstantRow(envConstant({}), 'env-2')).toBeNull();
      expect(toEnvironmentConstantRow(envConstant({}), 'env-unknown')).toBeNull();
    });

    it('should not mutate the cached constant it reads', () => {
      const cached = envConstant({});
      const snapshot = JSON.parse(JSON.stringify(cached));

      toEnvironmentConstantRow(cached, 'env-1');

      expect(cached).toEqual(snapshot);
    });
  });
});
