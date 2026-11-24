import { EntityManager } from 'typeorm';
import { formatJoinsJSONBPath, formatJSONB, formatTimestamp } from 'src/helpers/utils.helper';
import { TooljetDbDataOperationsService } from '@modules/tooljet-db/services/tooljet-db-data-operations.service';
import { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';

/** @group database */

// Literals are escaped and privilege checks bind their values.
describe('ToolJet Database SQL quoting', () => {
  describe('column default literals', () => {
    const tableOperations = Object.create(TooljetDbTableOperationsService.prototype) as {
      addQuotesIfString: (value: unknown) => unknown;
    };

    it('should escape a single quote inside a text default', () => {
      expect(tableOperations.addQuotesIfString("it's")).toBe("'it''s'");
    });

    it('should leave a non-string default untouched', () => {
      expect(tableOperations.addQuotesIfString(42)).toBe(42);
    });

    it('should escape a single quote inside a timestamp default', () => {
      expect(formatTimestamp("2024-01-01'x", { data_type: 'timestamp with time zone' })).toBe("'2024-01-01''x'");
    });

    it('should escape a single quote inside a jsonb key as well as a value', () => {
      expect(formatJSONB({ "it's": "rock'n'roll" }, { data_type: 'jsonb' })).toBe(`'{"it''s":"rock''n''roll"}'`);
    });
  });

  describe('join JSON paths', () => {
    it.each([
      ['->a', "->'a'"],
      ['->>a', "->>'a'"],
      ["->>'a b'", "->>'a b'"],
      ['->a->>b', "->'a'->>'b'"],
      ["-> 'a' ->> b", "-> 'a' ->> 'b'"],
      ['->0', "->'0'"],
    ])('should accept %s as %s', (jsonpath, expected) => {
      expect(formatJoinsJSONBPath(jsonpath)).toBe(expected);
    });

    it.each([['->a)'], ['a'], ['->'], ["->'a''"], ['->a; SELECT 1'], ['->a--'], ['->"a"']])(
      'should refuse %s',
      (jsonpath) => {
        expect(() => formatJoinsJSONBPath(jsonpath)).toThrow('Invalid JSON path');
      }
    );
  });

  describe('SQL mode privilege checks', () => {
    const dataOperations = Object.create(TooljetDbDataOperationsService.prototype) as {
      validateSchemaPrivileges: (manager: EntityManager, pgUser: string, schema: string) => Promise<void>;
      validateUserHasTablePrivileges: (
        map: Record<string, string>,
        manager: EntityManager,
        pgUser: string,
        schema: string,
        tableName: string,
        tenantSchema: string
      ) => Promise<void>;
      validateSchemaAndTablePrivileges: (
        manager: EntityManager,
        tenantSchema: string,
        pgUser: string,
        tableAndSchemaList: Array<{ schema: string; table: string }>,
        map: Record<string, string>
      ) => Promise<void>;
    };
    const QUOTED_SCHEMA = "a'b";
    let query: jest.Mock;
    let manager: EntityManager;

    beforeEach(() => {
      query = jest.fn().mockResolvedValue([{ has_schema_privilege: true, has_table_privilege: true }]);
      manager = { query } as unknown as EntityManager;
    });

    it('should pass the user and schema to the schema check as bind parameters', async () => {
      await dataOperations.validateSchemaPrivileges(manager, 'user_1', QUOTED_SCHEMA);

      const [sql, params] = query.mock.calls[0];
      expect(sql).not.toContain(QUOTED_SCHEMA);
      expect(params).toEqual(['user_1', QUOTED_SCHEMA]);
    });

    it('should pass the user, schema and relation to the table check as bind parameters', async () => {
      await dataOperations.validateUserHasTablePrivileges(
        { t1: 'relation-1' },
        manager,
        'user_1',
        QUOTED_SCHEMA,
        't1',
        'workspace_1'
      );

      const [sql, params] = query.mock.calls[0];
      expect(sql).not.toContain(QUOTED_SCHEMA);
      expect(params).toEqual(['user_1', QUOTED_SCHEMA, 'relation-1']);
    });

    it("should refuse a schema other than the workspace's before running any privilege query on it", async () => {
      await expect(
        dataOperations.validateSchemaAndTablePrivileges(
          manager,
          'workspace_1',
          'user_1',
          [{ schema: QUOTED_SCHEMA, table: 't1' }],
          { t1: 'relation-1' }
        )
      ).rejects.toThrow('You are not authorized to perform actions on some schemas.');

      expect(JSON.stringify(query.mock.calls)).not.toContain(QUOTED_SCHEMA);
    });

    it("should accept the workspace's own schema named explicitly", async () => {
      await expect(
        dataOperations.validateSchemaAndTablePrivileges(
          manager,
          'workspace_1',
          'user_1',
          [{ schema: 'workspace_1', table: 't1' }],
          { t1: 'relation-1' }
        )
      ).resolves.toBeUndefined();
    });
  });
});
