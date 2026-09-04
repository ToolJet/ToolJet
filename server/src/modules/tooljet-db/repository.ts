import { App } from '@entities/app.entity';
import { InternalTable } from '@entities/internal_table.entity';
import { Injectable } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { DataSource, Repository } from 'typeorm';

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
}
