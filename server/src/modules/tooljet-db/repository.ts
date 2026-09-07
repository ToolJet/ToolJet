import { App } from '@entities/app.entity';
import { InternalTable } from '@entities/internal_table.entity';
import { Injectable } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { findTenantSchema } from 'src/helpers/tooljet_db.helper';

// Shared between findTables and findDependents - a join_tables query references a table through
// the joined table itself and through either side of each join condition, three depths plus
// arrays. Duplicated at apps/util.service.ts:1496 and ee/platform-git-sync/push.service.ts:476;
// do not add a fourth copy.
export function addTablesInJoinOperation(uniqTableIds: Set<string>, joinOptions: Record<string, any>[]): void {
  if (isEmpty(joinOptions)) return;

  joinOptions.forEach((join) => {
    const { table, conditions } = join;

    if (table) uniqTableIds.add(table);
    conditions?.conditionsList?.forEach((condition) => {
      const { leftField, rightField } = condition;
      if (leftField?.table) uniqTableIds.add(leftField.table);
      if (rightField?.table) uniqTableIds.add(rightField.table);
    });
  });
}

const MAX_DEPENDENTS = 50;

export interface TableDependent {
  id: string;
  name: string;
  type: string;
  queries: { id: string; name: string }[];
}

export interface ForeignKeyDependent {
  id: string;
  name: string;
}

@Injectable()
export class InternalTableRepository extends Repository<InternalTable> {
  constructor(private dataSource: DataSource) {
    super(App, dataSource.createEntityManager());
  }

  async findTables(appId: string): Promise<{ table_id: string }[]> {
    const tooljetDbDataQueries = await this.dataSource
      .getRepository('data_queries')
      .createQueryBuilder('data_queries')
      .innerJoin('data_sources', 'data_sources', 'data_queries.data_source_id = data_sources.id')
      .innerJoin('app_versions', 'app_versions', 'app_versions.id = data_queries.app_version_id')
      .where('app_versions.app_id = :appId', { appId })
      .andWhere('data_sources.kind = :kind', { kind: 'tooljetdb' })
      .getMany();

    const uniqTableIds = new Set<string>();
    tooljetDbDataQueries.forEach((dq) => {
      if (dq.options?.table_id) uniqTableIds.add(dq.options.table_id);
      if (dq.options?.operation === 'join_tables')
        addTablesInJoinOperation(uniqTableIds, dq.options?.join_table?.joins || []);
    });

    return [...uniqTableIds].map((table_id) => ({ table_id }));
  }

  /**
   * Apps (front-end, workflow, or module - same `apps` table, same query) whose current draft or
   * any ever-released version has a query referencing `tableId`, org-wide. A floor, not a ceiling:
   * only finds *query* references (`options.table_id` or a join condition), so a table id
   * hardcoded in a RunJS query is invisible here.
   *
   * `data_queries.options` is `json`, not `jsonb` - no containment operator, no GIN index - so this
   * prefilters in SQL with a `LIKE` on the id's text form (a v4 uuid substring cannot collide
   * accidentally) and verifies the exact reference in JS with the same walker `findTables` uses,
   * rather than re-deriving the join-condition-scraping logic against SQL.
   *
   * Version-scoped narrower than `findTables` (which scans every version for one app): a table
   * referenced only by an abandoned old version of some other app must not alarm anyone here.
   */
  async findDependents(
    tableId: string,
    organizationId: string
  ): Promise<{ count: number; dependents: TableDependent[] }> {
    const rows = await this.dataSource
      .getRepository('data_queries')
      .createQueryBuilder('dq')
      .innerJoin('data_sources', 'ds', 'dq.data_source_id = ds.id')
      .innerJoin('app_versions', 'av', 'av.id = dq.app_version_id')
      .innerJoin('apps', 'a', 'a.id = av.app_id')
      .where('ds.kind = :kind', { kind: 'tooljetdb' })
      .andWhere('a.organization_id = :organizationId', { organizationId })
      .andWhere('dq.options::text LIKE :tableIdLike', { tableIdLike: `%${tableId}%` })
      .andWhere('(av.id = a.current_version_id OR av.released_at IS NOT NULL)')
      .select([
        'dq.id AS dq_id',
        'dq.name AS dq_name',
        'dq.options AS dq_options',
        'a.id AS app_id',
        'a.name AS app_name',
        'a.type AS app_type',
      ])
      .getRawMany();

    const byApp = new Map<string, TableDependent>();
    for (const row of rows) {
      const options = typeof row.dq_options === 'string' ? JSON.parse(row.dq_options) : row.dq_options;
      const referencedTableIds = new Set<string>();
      if (options?.table_id) referencedTableIds.add(options.table_id);
      if (options?.operation === 'join_tables')
        addTablesInJoinOperation(referencedTableIds, options?.join_table?.joins || []);
      if (!referencedTableIds.has(tableId)) continue;

      if (!byApp.has(row.app_id)) {
        byApp.set(row.app_id, { id: row.app_id, name: row.app_name, type: row.app_type, queries: [] });
      }
      byApp.get(row.app_id).queries.push({ id: row.dq_id, name: row.dq_name });
    }

    const dependents = [...byApp.values()];
    return { count: dependents.length, dependents: dependents.slice(0, MAX_DEPENDENTS) };
  }

  /**
   * The relation `perform()`'s DDL ops always resolve against (environment: undefined ->
   * development, per `TooljetDbRelationResolverService.getRelation`'s license-independent default).
   * Duplicated here rather than depending on the resolver service so this repository - and every
   * caller of `getDependents` - stays free of a constructor dependency on it; the predicate (priority
   * 1 environment, default branch) is the same one `resolveEnvironmentId`/`resolveBranch` apply.
   * Returns null if the table has no relation yet.
   */
  async findDevelopmentRelationId(organizationId: string, internalTableId: string): Promise<string | null> {
    const rows = await this.dataSource.query(
      `SELECT rel.id
       FROM internal_table_relations rel
       INNER JOIN app_environments env ON env.id = rel.environment_id AND env.priority = 1
       INNER JOIN organization_git_sync_branches wb ON wb.id = rel.branch_id AND wb.is_default = true
       WHERE rel.internal_table_id = $1 AND env.organization_id = $2 AND wb.organization_id = $2`,
      [internalTableId, organizationId]
    );
    return rows[0]?.id ?? null;
  }

  /**
   * TJDB tables holding a live Postgres foreign key into `relationId` (this table's physical,
   * current-environment relation) - the case this repository's own `findDependents` cannot see,
   * since it lives in `pg_constraint`, not `data_queries`. A physical table is named by relation
   * uuid, never the logical table name, so
   * each `pg_constraint` hit is mapped back through `internal_table_relations` -> `internal_tables`
   * to a human-readable `{ id, name }`. Self-references (`conrelid = confrelid`) are excluded - a
   * table's own foreign key onto itself must never block its own drop.
   *
   * `tooljetDbManager` is required: the physical tables and `pg_constraint` this introspects live in
   * the tooljetDb Postgres connection, a different database entirely from the one this repository's
   * own `dataSource` (App-side entities) talks to. Both callers already hold this manager (`this.
   * tooljetDbManager`, injected via `@InjectEntityManager('tooljetDb')`); it is not repeated here.
   */
  async findForeignKeyDependents(
    organizationId: string,
    relationId: string,
    tooljetDbManager: EntityManager
  ): Promise<ForeignKeyDependent[]> {
    const schema = findTenantSchema(organizationId);
    const referencing: { relname: string }[] = await tooljetDbManager.query(
      `SELECT DISTINCT t.relname
       FROM pg_constraint c
       INNER JOIN pg_class rt ON rt.oid = c.confrelid
       INNER JOIN pg_namespace n ON n.oid = rt.relnamespace
       INNER JOIN pg_class t ON t.oid = c.conrelid
       WHERE c.contype = 'f' AND n.nspname = $1 AND rt.relname = $2 AND c.conrelid <> c.confrelid`,
      [schema, relationId]
    );
    if (!referencing.length) return [];

    const referencingRelationIds = referencing.map((row) => row.relname);
    const rows = await this.dataSource
      .createQueryBuilder()
      .select(['it.id AS id', 'it.table_name AS name'])
      .from('internal_table_relations', 'relation')
      .innerJoin('internal_tables', 'it', 'it.id = relation.internal_table_id')
      .where('relation.id::text IN (:...referencingRelationIds)', { referencingRelationIds })
      .andWhere('it.organization_id = :organizationId', { organizationId })
      .andWhere('it.deleted_at IS NULL')
      .getRawMany();

    const byId = new Map<string, ForeignKeyDependent>();
    for (const row of rows) byId.set(row.id, { id: row.id, name: row.name });
    return [...byId.values()];
  }
}
