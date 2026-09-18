/** @group database */
import {
  buildCreateTableDdl,
  rewriteSerialDefaults,
  synthesizeBaseline,
} from '@modules/tooljet-db/helpers/baseline-synthesis';
import { TableSchemaSnapshotColumn } from '@modules/tooljet-db/helpers/table-schema-snapshot';

const SCHEMA = 'tenant_org';
const TABLE_ID = '11111111-1111-4111-8111-111111111111';

const idColumn = {
  column_name: 'id',
  data_type: 'integer',
  is_nullable: false,
  column_default: `nextval('"${SCHEMA}"."${TABLE_ID}_id_seq"'::regclass)`,
};
const nameColumn = {
  column_name: 'name',
  data_type: 'text',
  is_nullable: true,
  column_default: null,
};

// A minimal Queryable stand-in that routes by a distinctive substring in the SQL, matching the
// shape `synthesizeBaseline` expects from a real QueryRunner (only `.query()` is ever called).
function fakeTjdbQueryRunner() {
  return {
    query: jest.fn((sql: string) => {
      if (sql.includes('to_regclass')) return Promise.resolve([{ oid: `${SCHEMA}.${TABLE_ID}` }]);
      if (sql.includes('FROM pg_attribute')) return Promise.resolve([idColumn, nameColumn]);
      if (sql.includes(`c.contype = 'p'`)) return Promise.resolve([{ column_name: 'id' }]);
      if (sql.includes(`c.contype = 'u'`)) return Promise.resolve([]);
      if (sql.includes('FROM pg_index')) return Promise.resolve([]);
      if (sql.includes(`c.contype = 'f'`)) return Promise.resolve([]);
      throw new Error(`unexpected query in test double: ${sql}`);
    }),
  } as any;
}

function fakeAppQueryRunner() {
  return { query: jest.fn() } as any;
}

describe('baseline-synthesis', () => {
  describe('synthesizeBaseline', () => {
    it('should produce a sequence-1 payload with no physical relation id and a self-derived serial default', async () => {
      const columnNames = { id: 'col-id-uuid', name: 'col-name-uuid' };
      const configurations = { columns: { column_names: columnNames } };

      const migrations = await synthesizeBaseline(
        fakeAppQueryRunner(),
        fakeTjdbQueryRunner(),
        SCHEMA,
        TABLE_ID,
        configurations
      );

      expect(migrations).toHaveLength(1);
      const [{ sequence, payload, resultingSchema }] = migrations;
      expect(sequence).toBe(1);
      expect(payload).toMatchObject({ refs: {}, column_uuids: columnNames });
      expect(payload.ddl).toContain('{{self}}');
      expect(payload.ddl).not.toContain(TABLE_ID);
      expect(resultingSchema.foreign_keys).toEqual([]);
    });

    it('should throw when the physical relation does not exist', async () => {
      const tjdbQueryRunner = {
        query: jest.fn((sql: string) => {
          if (sql.includes('to_regclass')) return Promise.resolve([{ oid: null }]);
          throw new Error(`unexpected query: ${sql}`);
        }),
      } as any;

      await expect(
        synthesizeBaseline(fakeAppQueryRunner(), tjdbQueryRunner, SCHEMA, TABLE_ID, {
          columns: { column_names: {} },
        })
      ).rejects.toThrow(/does not exist/);
    });
  });

  describe('rewriteSerialDefaults', () => {
    it('should rewrite a serial column default to a {{self}}-derived sequence and leave others untouched', () => {
      const columns: TableSchemaSnapshotColumn[] = [
        {
          name: 'id',
          uuid: 'col-id-uuid',
          data_type: 'integer',
          is_nullable: false,
          default: `nextval('"${SCHEMA}"."${TABLE_ID}_id_seq"'::regclass)`,
          is_primary_key: true,
        },
        {
          name: 'name',
          uuid: 'col-name-uuid',
          data_type: 'text',
          is_nullable: true,
          default: null,
          is_primary_key: false,
        },
      ];

      const { columns: rewritten, sequenceDdl, ownershipDdl } = rewriteSerialDefaults(SCHEMA, TABLE_ID, columns);

      expect(rewritten[0].default).toBe(`nextval('"${SCHEMA}"."{{self}}_id_seq"'::regclass)`);
      expect(rewritten[0].default).not.toContain(TABLE_ID);
      expect(rewritten[1]).toEqual(columns[1]);
      expect(sequenceDdl).toEqual([`CREATE SEQUENCE "${SCHEMA}"."{{self}}_id_seq"`]);
      expect(ownershipDdl).toEqual([
        `ALTER SEQUENCE "${SCHEMA}"."{{self}}_id_seq" OWNED BY "${SCHEMA}"."{{self}}"."id"`,
      ]);
    });

    it("should leave a default that is not this table's own sequence unchanged", () => {
      const columns: TableSchemaSnapshotColumn[] = [
        {
          name: 'other_seq',
          uuid: 'col-other-uuid',
          data_type: 'integer',
          is_nullable: false,
          default: `nextval('"${SCHEMA}"."some_other_table_seq"'::regclass)`,
          is_primary_key: false,
        },
      ];

      const { columns: rewritten, sequenceDdl, ownershipDdl } = rewriteSerialDefaults(SCHEMA, TABLE_ID, columns);

      expect(rewritten).toEqual(columns);
      expect(sequenceDdl).toEqual([]);
      expect(ownershipDdl).toEqual([]);
    });
  });

  describe('buildCreateTableDdl', () => {
    it('should call through to rewriteSerialDefaults so a serial default in the emitted DDL is {{self}}-derived', () => {
      const columns: TableSchemaSnapshotColumn[] = [
        {
          name: 'id',
          uuid: 'col-id-uuid',
          data_type: 'integer',
          is_nullable: false,
          default: `nextval('"${SCHEMA}"."${TABLE_ID}_id_seq"'::regclass)`,
          is_primary_key: true,
        },
      ];

      const ddl = buildCreateTableDdl(SCHEMA, TABLE_ID, columns, ['id']);

      expect(ddl).toContain(`CREATE SEQUENCE "${SCHEMA}"."{{self}}_id_seq"`);
      expect(ddl).toContain(`DEFAULT nextval('"${SCHEMA}"."{{self}}_id_seq"'::regclass)`);
      expect(ddl).not.toContain(TABLE_ID);
    });

    it('should emit valid array-type DDL, not the bare word ARRAY', () => {
      // Regression test: information_schema.columns.data_type collapses every array column to the
      // literal string 'ARRAY' (element type discarded), which is not valid Postgres DDL on its own.
      // fetchColumns (table-schema-snapshot.ts) now sources data_type via format_type(), which
      // renders array columns as e.g. 'text[]' - exactly what CREATE TABLE needs.
      const columns: TableSchemaSnapshotColumn[] = [
        {
          name: 'tags',
          uuid: 'col-tags-uuid',
          data_type: 'text[]',
          is_nullable: true,
          default: null,
          is_primary_key: false,
        },
      ];

      const ddl = buildCreateTableDdl(SCHEMA, TABLE_ID, columns, []);

      expect(ddl).toContain('"tags" text[]');
      expect(ddl).not.toContain('"tags" ARRAY');
    });
  });
});
