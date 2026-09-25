/** @group database */
import { QueryRunner } from 'typeorm';
import {
  buildCreateTableDdl,
  buildForeignKeyDdl,
  rewriteSerialDefaults,
  synthesizeBaseline,
} from '@modules/tooljet-db/helpers/baseline-synthesis';
import {
  TableSchemaSnapshotColumn,
  TableSchemaSnapshotForeignKey,
} from '@modules/tooljet-db/helpers/table-schema-snapshot';

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
// Only used for synthesizeBaseline's own top-level branching (relation exists / does not) - the
// three pure builders it delegates to (buildCreateTableDdl, rewriteSerialDefaults,
// buildForeignKeyDdl) are tested directly below instead of through this double, and the
// composite-primary-key-blocks-baseline branch is covered against real tables in
// tjdb-baseline-repair.spec.ts (testing.md: internal branching a util owns is unit-tested, but a
// double that has to re-route five different queries by substring to reach it just pins this spec
// to another file's exact SQL wording).
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
  } as unknown as QueryRunner;
}

function fakeAppQueryRunner() {
  return { query: jest.fn() } as unknown as QueryRunner;
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
      } as unknown as QueryRunner;

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
    // buildCreateTableDdl is a pure function from 4 arguments to a string - one exact `toBe` on
    // the full output covers every clause (columns, PRIMARY KEY, every UNIQUE), where a handful of
    // `toContain` checks would hide whichever clause nobody thought to assert on. Confirmed against
    // the reviewer's own mutation table: this exact assertion fails if the PRIMARY KEY clause, the
    // UNIQUE loop, or the sequence rewrite is dropped from the implementation.
    it('should emit CREATE TABLE with a {{self}}-derived serial default, a composite primary key, and every unique constraint', () => {
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
          name: 'tenant_id',
          uuid: 'col-tenant-uuid',
          data_type: 'integer',
          is_nullable: false,
          default: null,
          is_primary_key: true,
        },
        {
          name: 'email',
          uuid: 'col-email-uuid',
          data_type: 'text',
          is_nullable: true,
          default: null,
          is_primary_key: false,
        },
      ];

      const ddl = buildCreateTableDdl(
        SCHEMA,
        TABLE_ID,
        columns,
        ['id', 'tenant_id'],
        [
          { name: 'users_email_key', column_names: ['email'] },
          { name: 'users_id_tenant_key', column_names: ['id', 'tenant_id'] },
        ]
      );

      expect(ddl).toBe(
        [
          `CREATE SEQUENCE "${SCHEMA}"."{{self}}_id_seq"`,
          [
            `CREATE TABLE "${SCHEMA}"."{{self}}" (`,
            `  "id" integer NOT NULL DEFAULT nextval('"${SCHEMA}"."{{self}}_id_seq"'::regclass),`,
            `  "tenant_id" integer NOT NULL,`,
            `  "email" text,`,
            `  PRIMARY KEY ("id", "tenant_id"),`,
            `  UNIQUE ("email"),`,
            `  UNIQUE ("id", "tenant_id")`,
            `)`,
          ].join('\n'),
          `ALTER SEQUENCE "${SCHEMA}"."{{self}}_id_seq" OWNED BY "${SCHEMA}"."{{self}}"."id"`,
        ].join(';\n')
      );
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

  describe('buildForeignKeyDdl', () => {
    // Never reached through synthesizeBaseline's own double above (which always returns [] for
    // foreign keys) - tested directly instead, against a real return shape for its one query
    // (a single parameterized SELECT by id, not five routed by SQL substring).
    function fakeInternalTablesQueryRunner(coRelationIdByTableId: Record<string, string>) {
      const query = jest.fn((sql: string, params: string[]) => {
        const [tableId] = params;
        const coRelationId = coRelationIdByTableId[tableId];
        return Promise.resolve(coRelationId ? [{ co_relation_id: coRelationId }] : []);
      });
      return { runner: { query } as unknown as QueryRunner, query };
    }

    function foreignKey(overrides: Partial<TableSchemaSnapshotForeignKey> = {}): TableSchemaSnapshotForeignKey {
      return {
        name: 'fk_orders_customer',
        column_names: ['customer_id'],
        referenced_table: 'customers-relation-id',
        referenced_column_names: ['id'],
        ...overrides,
      };
    }

    it('should emit an ALTER TABLE referencing the {{ref}} placeholder and resolve it to the co_relation_id', async () => {
      const { runner, query } = fakeInternalTablesQueryRunner({ 'customers-relation-id': 'customers-co-relation-id' });
      const refs: Record<string, string> = {};

      const ddl = await buildForeignKeyDdl(runner, SCHEMA, [foreignKey()], refs);

      expect(ddl).toBe(
        `ALTER TABLE "${SCHEMA}"."{{self}}" ADD CONSTRAINT "fk_orders_customer" FOREIGN KEY ("customer_id") REFERENCES "${SCHEMA}"."{{ref_0}}" ("id")`
      );
      expect(refs).toEqual({ ref_0: 'customers-co-relation-id' });
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('should reuse the same placeholder, and query only once, for two foreign keys to the same table', async () => {
      const { runner, query } = fakeInternalTablesQueryRunner({ 'customers-relation-id': 'customers-co-relation-id' });
      const refs: Record<string, string> = {};
      const foreignKeys = [
        foreignKey({ name: 'fk_orders_customer', column_names: ['customer_id'] }),
        foreignKey({ name: 'fk_orders_billing_customer', column_names: ['billing_customer_id'] }),
      ];

      const ddl = await buildForeignKeyDdl(runner, SCHEMA, foreignKeys, refs);

      const statements = ddl.split(';\n');
      expect(statements).toHaveLength(2);
      expect(statements.every((s) => s.includes('{{ref_0}}'))).toBe(true);
      expect(refs).toEqual({ ref_0: 'customers-co-relation-id' });
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('should assign distinct placeholders for foreign keys to different tables', async () => {
      const { runner } = fakeInternalTablesQueryRunner({
        'customers-relation-id': 'customers-co-relation-id',
        'warehouses-relation-id': 'warehouses-co-relation-id',
      });
      const refs: Record<string, string> = {};
      const foreignKeys = [
        foreignKey({ name: 'fk_orders_customer', referenced_table: 'customers-relation-id' }),
        foreignKey({
          name: 'fk_orders_warehouse',
          referenced_table: 'warehouses-relation-id',
          column_names: ['warehouse_id'],
        }),
      ];

      const ddl = await buildForeignKeyDdl(runner, SCHEMA, foreignKeys, refs);

      expect(ddl).toContain('{{ref_0}}');
      expect(ddl).toContain('{{ref_1}}');
      expect(refs).toEqual({ ref_0: 'customers-co-relation-id', ref_1: 'warehouses-co-relation-id' });
    });

    it('should throw when the foreign key references an internal table id that no longer exists', async () => {
      const { runner } = fakeInternalTablesQueryRunner({});

      await expect(buildForeignKeyDdl(runner, SCHEMA, [foreignKey()], {})).rejects.toThrow(
        /references unknown internal table/
      );
    });
  });
});
