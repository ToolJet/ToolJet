import { Injectable, NotFoundException } from '@nestjs/common';
import PostgrestQueryBuilder from 'src/helpers/postgrest_query_builder';
import { QueryService, QueryResult, QueryError } from '@tooljet/plugins/dist/packages/common/lib';
import { TooljetDbTableOperationsService } from './tooljet-db-table-operations.service';
import { isEmpty } from 'lodash';
import { maybeSetSubPath } from 'src/helpers/utils.helper';

import { AST, Parser } from 'node-sql-parser/build/postgresql';
import {
  createTooljetDatabaseConnection,
  decryptTooljetDatabasePassword,
  findTenantSchema,
  isSQLModeDisabled,
  modifyTjdbErrorObject,
} from 'src/helpers/tooljet_db.helper';
import { EntityManager, In, QueryFailedError } from 'typeorm';
import { OrganizationTjdbConfigurations } from 'src/entities/organization_tjdb_configurations.entity';
import { Organization } from 'src/entities/organization.entity';
import { InternalTable } from 'src/entities/internal_table.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PostgrestProxyService } from './postgrest-proxy.service';
import { PostgrestError, TooljetDatabaseError } from '../types';
import { TooljetDbBulkUploadService } from './tooljet-db-bulk-upload.service';
import { TooljetDbRelationResolverService } from './relation-resolver.service';

// This service encapsulates all TJDB data manipulation operations
// which can act like any other datasource
@Injectable()
export class TooljetDbDataOperationsService implements QueryService {
  constructor(
    protected readonly manager: EntityManager,
    protected readonly tableOperationsService: TooljetDbTableOperationsService,
    protected readonly postgrestProxyService: PostgrestProxyService,
    @InjectEntityManager('tooljetDb')
    protected readonly tooljetDbManager: EntityManager,
    protected readonly configService: ConfigService,
    protected readonly tooljetDbBulkUploadService: TooljetDbBulkUploadService,
    protected readonly relationResolverService: TooljetDbRelationResolverService
  ) {}

  /**
   * Resolves colOpts.columnId (when present) to the column's current name via the relation
   * resolver, falling back to colOpts.column when there's no id, or the id no longer resolves
   * (column deleted/renamed away since the query was saved) - same fail-soft-to-caller contract
   * as the resolver itself. Options with no columnId (queries saved before Task 4) are untouched.
   */
  private async resolveColumnName(
    organizationId: string,
    tableId: string,
    colOpts: { column?: string; columnId?: string },
    environmentId: string | undefined
  ): Promise<string | undefined> {
    if (!colOpts?.columnId) return colOpts?.column;
    const resolved = await this.relationResolverService.resolveColumnName(
      organizationId,
      tableId,
      colOpts.columnId,
      environmentId
    );
    return resolved ?? colOpts.column;
  }

  /**
   * Batch variant of resolveColumnName(): one relation load resolves every entry's columnId, so
   * an operation touching several columns (create_row's payload, update_rows' columns map, a
   * where_filters/order_filters set) doesn't pay N relation loads. Returns names in the same
   * order as `entries`.
   */
  private async resolveColumnNames(
    organizationId: string,
    tableId: string,
    entries: Array<{ column?: string; columnId?: string }>,
    environmentId: string | undefined
  ): Promise<Array<string | undefined>> {
    const columnIds = [...new Set(entries.filter((entry) => entry?.columnId).map((entry) => entry.columnId))];
    const resolvedMap = columnIds.length
      ? await this.relationResolverService.resolveColumnNames(organizationId, tableId, columnIds, environmentId)
      : new Map<string, string | null>();
    return entries.map((entry) =>
      entry?.columnId ? (resolvedMap.get(entry.columnId) ?? entry.column) : entry?.column
    );
  }

  /**
   * Resolves the `column` field inside every entry of a where_filters/order_filters map in
   * place-equivalent fashion (returns a new map - buildPostgrestQuery only ever reads the result).
   * Entries without a columnId pass through untouched.
   */
  private async resolveFilterColumns(
    organizationId: string,
    tableId: string,
    filters: Record<string, { column?: string; columnId?: string; [key: string]: any }> | undefined,
    environmentId: string | undefined
  ): Promise<typeof filters> {
    if (isEmpty(filters)) return filters;
    const keys = Object.keys(filters);
    const resolvedNames = await this.resolveColumnNames(
      organizationId,
      tableId,
      keys.map((key) => filters[key]),
      environmentId
    );
    return keys.reduce(
      (acc, key, index) => {
        acc[key] = { ...filters[key], column: resolvedNames[index] };
        return acc;
      },
      {} as typeof filters
    );
  }

  /**
   * A single column-bearing slot inside join_table JSON: `get`/`set` read and write whatever key
   * that shape actually uses for the column name (`columnName` for conditions/order_by, `name`
   * for fields, `column` for aggregates/group_by) without the collector needing to know which.
   */
  private static makeColumnRef(
    table: string | undefined,
    columnId: string | undefined,
    get: () => string | undefined,
    set: (name: string) => void
  ): { table?: string; columnId?: string; get: () => string | undefined; set: (name: string) => void } {
    return { table, columnId, get, set };
  }

  /**
   * Resolves a batch of column refs that all belong to the same table: one relation load
   * resolves every ref's columnId, same batching rationale as resolveColumnNames(). Refs with no
   * columnId are left untouched (no id to resolve); a columnId that no longer resolves falls back
   * to whatever the ref already held, same fail-soft contract as resolveColumnName().
   */
  private async resolveColumnRefs(
    organizationId: string,
    tableId: string,
    refs: Array<{ columnId?: string; get: () => string | undefined; set: (name: string) => void }>,
    environmentId: string | undefined
  ): Promise<void> {
    const refsWithId = refs.filter((ref) => ref.columnId);
    if (!refsWithId.length) return;
    const columnIds = [...new Set(refsWithId.map((ref) => ref.columnId))];
    const resolvedMap = await this.relationResolverService.resolveColumnNames(
      organizationId,
      tableId,
      columnIds,
      environmentId
    );
    for (const ref of refsWithId) {
      const resolved = resolvedMap.get(ref.columnId);
      if (resolved) ref.set(resolved);
    }
  }

  /**
   * Returns a deep-cloned, columnId-resolved copy of join_table JSON - never mutates the caller's
   * queryOptions (see finding #7: joinTables only shallow-copies join_table, so join/condition
   * sub-objects are shared references with the original options the caller may reuse/log/re-save).
   *
   * Resolves columnId on every column-bearing entry, not just conditions (finding #3): the ON/WHERE
   * conditions (top-level and each join's), the mandatory SELECT list (`fields`), `order_by`, and
   * `group_by`/`aggregates`. Grouped by the logical table a field addresses (field.table for
   * conditions/fields/order_by, aggregate.table_id for aggregates, the group_by map's own key for
   * group_by - it's already keyed by table) so a join across N tables costs N relation loads, not
   * one per column.
   *
   * group_by entries may be a bare column name string (legacy/no rename to resolve) or
   * `{ column, columnId }`; either way the resolved value collapses back to a bare string, so
   * table-operations' consumer of group_by never has to learn the object shape.
   */
  private async resolveJoinColumns(
    organizationId: string,
    joinQueryJson: Record<string, any>,
    environmentId: string | undefined
  ): Promise<Record<string, any>> {
    const cloned = structuredClone(joinQueryJson);
    type ColumnRef = { table?: string; columnId?: string; get: () => string | undefined; set: (name: string) => void };
    const refs: ColumnRef[] = [];

    const collectConditions = (conditions: any) => {
      conditions?.conditionsList?.forEach((condition: any) => {
        (['leftField', 'rightField'] as const).forEach((side) => {
          const field = condition[side];
          if (field?.type === 'Column') {
            refs.push(
              TooljetDbDataOperationsService.makeColumnRef(
                field.table,
                field.columnId,
                () => field.columnName,
                (name) => {
                  field.columnName = name;
                }
              )
            );
          }
        });
      });
    };
    collectConditions(cloned.conditions);
    (cloned.joins || []).forEach((join: any) => collectConditions(join.conditions));

    (cloned.fields || []).forEach((field: any) => {
      refs.push(
        TooljetDbDataOperationsService.makeColumnRef(
          field.table,
          field.columnId,
          () => field.name,
          (name) => {
            field.name = name;
          }
        )
      );
    });

    (cloned.order_by || []).forEach((entry: any) => {
      refs.push(
        TooljetDbDataOperationsService.makeColumnRef(
          entry.table,
          entry.columnId,
          () => entry.columnName,
          (name) => {
            entry.columnName = name;
          }
        )
      );
    });

    Object.values<any>(cloned.aggregates || {}).forEach((aggregate: any) => {
      refs.push(
        TooljetDbDataOperationsService.makeColumnRef(
          aggregate.table_id,
          aggregate.columnId,
          () => aggregate.column,
          (name) => {
            aggregate.column = name;
          }
        )
      );
    });

    Object.entries<any>(cloned.group_by || {}).forEach(([tableId, entries]) => {
      if (!Array.isArray(entries)) return;
      entries.forEach((entry: any, index: number) => {
        if (typeof entry === 'string') return;
        refs.push(
          TooljetDbDataOperationsService.makeColumnRef(
            tableId,
            entry?.columnId,
            () => entry?.column,
            (name) => {
              entries[index] = name;
            }
          )
        );
      });
    });

    const refsByTable = new Map<string, ColumnRef[]>();
    for (const ref of refs) {
      if (!ref.table) continue;
      if (!refsByTable.has(ref.table)) refsByTable.set(ref.table, []);
      refsByTable.get(ref.table).push(ref);
    }

    for (const [tableId, tableRefs] of refsByTable) {
      await this.resolveColumnRefs(organizationId, tableId, tableRefs, environmentId);
    }

    return cloned;
  }

  /**
   * Returns a deep-cloned, columnId-resolved copy of list_rows' aggregates/group_by (finding #4).
   * Single-table operation - the tableId is already known, no per-field table grouping needed like
   * resolveJoinColumns, so this is one resolveColumnRefs() call. Same group_by entry convention as
   * resolveJoinColumns: a bare string passes through, `{ column, columnId }` resolves and collapses
   * back to a bare string.
   */
  private async resolveAggregateAndGroupByColumns(
    organizationId: string,
    tableId: string,
    aggregates: Record<string, { aggFx: string; column: string; columnId?: string }>,
    groupBy: Record<string, Array<string | { column: string; columnId?: string }>>,
    environmentId: string | undefined
  ): Promise<{
    aggregates: typeof aggregates;
    groupBy: Record<string, Array<string>>;
  }> {
    if (isEmpty(aggregates) && isEmpty(groupBy))
      return { aggregates, groupBy: groupBy as unknown as Record<string, Array<string>> };

    const cloned = structuredClone({ aggregates, groupBy });
    const refs: Array<{ columnId?: string; get: () => string | undefined; set: (name: string) => void }> = [];

    Object.values<any>(cloned.aggregates).forEach((aggregate: any) => {
      refs.push({
        columnId: aggregate.columnId,
        get: () => aggregate.column,
        set: (name) => {
          aggregate.column = name;
        },
      });
    });

    Object.values<any>(cloned.groupBy).forEach((entries: any) => {
      if (!Array.isArray(entries)) return;
      entries.forEach((entry: any, index: number) => {
        if (typeof entry === 'string') return;
        refs.push({
          columnId: entry?.columnId,
          get: () => entry?.column,
          set: (name) => {
            entries[index] = name;
          },
        });
      });
    });

    await this.resolveColumnRefs(organizationId, tableId, refs, environmentId);
    // Every group_by entry above is either an untouched string or has just been overwritten with
    // the resolved column name string via `set` - the array is string[] at runtime even though the
    // clone's static type still carries the pre-resolution `string | {column, columnId}` union.
    return { aggregates: cloned.aggregates, groupBy: cloned.groupBy as unknown as Record<string, Array<string>> };
  }

  async run(
    _sourceOptions,
    queryOptions,
    _dataSourceCacheId,
    _dataSourceCacheUpdatedAt,
    context
  ): Promise<QueryResult> {
    switch (queryOptions.operation) {
      case 'list_rows':
        return this.listRows(queryOptions, context);
      case 'create_row':
        return this.createRow(queryOptions, context);
      case 'update_rows':
        return this.updateRows(queryOptions, context);
      case 'delete_rows':
        return this.deleteRows(queryOptions, context);
      case 'join_tables':
        // custom implementation without PostgREST
        return this.joinTables(queryOptions, context);
      case 'sql_execution':
        return this.sqlExecution(queryOptions, context);
      case 'bulk_update_with_primary_key':
        return this.bulkUpdateWithPrimaryKey(queryOptions, context);
      case 'bulk_upsert_with_primary_key':
        return this.bulkUpsertUsingPrimaryKey(queryOptions, context);
      default:
        return {
          status: 'failed',
          data: {},
          errorMessage: 'Invalid operation',
        };
    }
  }

  protected async proxyPostgrest(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    headers: Record<string, string>,
    body: Record<string, any>,
    environmentId: string | undefined
  ): Promise<QueryResult> {
    const result: any = await this.postgrestProxyService.perform(url, method, headers, body, environmentId);

    return { status: 'ok', data: result };
  }

  async bulkUpdateWithPrimaryKey(queryOptions, context): Promise<QueryResult> {
    if (hasNullValueInFilters(queryOptions, 'bulk_update_with_primary_key')) {
      return {
        status: 'failed',
        errorMessage: 'Null value comparison not allowed, To check null values Please use IS operator instead.',
        data: {},
      };
    }

    try {
      const { table_id: tableId, bulk_update_with_primary_key: bulkUpdateWithPrimaryKey } = queryOptions;
      const {
        primary_key: primaryKeyColumn,
        primary_key_ids: primaryKeyColumnIds,
        rows_update: rowsToUpdate,
      } = bulkUpdateWithPrimaryKey;
      const { organization_id: organizationId, environment_id: environmentId } = context.app;

      // Mirrors bulkUpsertUsingPrimaryKey: primary_key is a composite key ARRAY of column names,
      // primary_key_ids the same-index array of columnIds. resolveColumnName (singular) would
      // collapse the whole array to one resolved string - see finding #1.
      const primaryKeyColumns = Array.isArray(primaryKeyColumn) ? primaryKeyColumn : [primaryKeyColumn];
      const resolvedPrimaryKeyColumns = await this.resolveColumnNames(
        organizationId,
        tableId,
        primaryKeyColumns.map((column, index) => ({ column, columnId: primaryKeyColumnIds?.[index] })),
        environmentId
      );

      const result = await this.tooljetDbBulkUploadService.bulkUpdateRowsWithPrimaryKey(
        rowsToUpdate,
        tableId,
        resolvedPrimaryKeyColumns,
        organizationId,
        environmentId
      );

      if (result.status === 'failed') {
        return {
          status: result?.status,
          errorMessage: result?.error,
          data: {},
        };
      } else if (result.status === 'ok') {
        return {
          status: 'ok',
          data: result.data,
        };
      }
    } catch (error) {
      return {
        status: 'failed',
        errorMessage: error,
        data: {},
      };
    }
  }

  async listRows(queryOptions, context): Promise<QueryResult> {
    if (hasNullValueInFilters(queryOptions, 'list_rows')) {
      return {
        status: 'failed',
        errorMessage: 'Null value comparison not allowed, To check null values Please use IS operator instead.',
        data: {},
      };
    }
    try {
      const { table_id: tableId, list_rows: listRows } = queryOptions;
      const { organization_id: organizationId, environment_id: environmentId } = context.app;
      const query = [];

      if (!isEmpty(listRows)) {
        const {
          limit,
          where_filters: whereFilters,
          order_filters: orderFilters,
          offset,
          aggregates = {},
          group_by: groupBy = {},
        } = listRows;

        if (limit && isNaN(limit))
          throw new QueryError('An incorrect limit value.', 'Limit should be a valid integer', {});
        if (offset && isNaN(offset))
          throw new QueryError('An incorrect offset value.', 'Offset should be a valid integer', {});

        const internalTable = await this.manager.findOne(InternalTable, {
          where: {
            organizationId,
            id: tableId,
          },
        });

        if (!internalTable) throw new NotFoundException('Table not found');

        const resolvedWhereFilters = await this.resolveFilterColumns(
          organizationId,
          tableId,
          whereFilters,
          environmentId
        );
        const resolvedOrderFilters = await this.resolveFilterColumns(
          organizationId,
          tableId,
          orderFilters,
          environmentId
        );
        const whereQuery = buildPostgrestQuery(resolvedWhereFilters);
        const orderQuery = buildPostgrestQuery(resolvedOrderFilters);
        if (!isEmpty(aggregates) || !isEmpty(groupBy)) {
          const resolved = await this.resolveAggregateAndGroupByColumns(
            organizationId,
            tableId,
            aggregates,
            groupBy,
            environmentId
          );
          const groupByAndAggregateQueryList = this.buildAggregateAndGroupByQuery(
            internalTable.tableName,
            resolved.aggregates,
            resolved.groupBy
          );
          if (groupByAndAggregateQueryList.length) query.push(`select=${groupByAndAggregateQueryList.join(',')}`);
        }
        if (!isEmpty(whereQuery)) query.push(whereQuery);
        if (!isEmpty(orderQuery)) query.push(orderQuery);
        if (limit != null && limit !== '') query.push(`limit=${limit}`);
        if (offset != null && offset !== '') query.push(`offset=${offset}`);
      }

      const headers = { 'data-query-id': queryOptions.id, 'tj-workspace-id': organizationId };
      const url =
        query.length > 0
          ? `/api/tooljet-db/proxy/${tableId}` + `?${query.join('&')}`
          : `/api/tooljet-db/proxy/${tableId}`;

      return await this.proxyPostgrest(maybeSetSubPath(url), 'GET', headers, {}, environmentId);
    } catch (error) {
      throw new QueryError(error.message, error.message, {});
    }
  }

  async createRow(queryOptions, context): Promise<QueryResult> {
    const { table_id: tableId, create_row: createRow } = queryOptions;
    const { organization_id: organizationId, environment_id: environmentId } = context.app;
    const colOptsList = Object.values<{ column: string; columnId?: string; value: any }>(createRow);
    const resolvedNames = await this.resolveColumnNames(organizationId, tableId, colOptsList, environmentId);
    const columns = colOptsList.reduce((acc, colOpts, index) => {
      const columnName = resolvedNames[index];
      if (isEmpty(columnName)) return acc;
      return Object.assign(acc, { [columnName]: colOpts.value });
    }, {});
    const headers = { 'data-query-id': queryOptions.id, 'tj-workspace-id': organizationId };

    const url = maybeSetSubPath(`/api/tooljet-db/proxy/${tableId}`);
    return await this.proxyPostgrest(url, 'POST', headers, columns, environmentId);
  }

  async updateRows(queryOptions, context): Promise<QueryResult> {
    if (hasNullValueInFilters(queryOptions, 'update_rows')) {
      return {
        status: 'failed',
        errorMessage: 'Null value comparison not allowed, To check null values Please use IS operator instead.',
        data: {},
      };
    }
    const { table_id: tableId, update_rows: updateRows } = queryOptions;
    const { where_filters: whereFilters, columns } = updateRows;
    const { organization_id: organizationId, environment_id: environmentId } = context.app;

    const query = [];
    const resolvedWhereFilters = await this.resolveFilterColumns(organizationId, tableId, whereFilters, environmentId);
    const whereQuery = buildPostgrestQuery(resolvedWhereFilters);
    const colOptsList = Object.values<{ column: string; columnId?: string; value: any }>(columns);
    const resolvedColumnNames = await this.resolveColumnNames(organizationId, tableId, colOptsList, environmentId);
    const body = colOptsList.reduce((acc, colOpts, index) => {
      const columnName = resolvedColumnNames[index];
      if (isEmpty(columnName)) return acc;
      return Object.assign(acc, { [columnName]: colOpts.value });
    }, {});

    if (!isEmpty(whereQuery)) query.push(whereQuery);

    const headers = { 'data-query-id': queryOptions.id, 'tj-workspace-id': organizationId };
    const url = maybeSetSubPath(`/api/tooljet-db/proxy/${tableId}?` + query.join('&') + '&order=id');
    return await this.proxyPostgrest(url, 'PATCH', headers, body, environmentId);
  }

  async deleteRows(queryOptions, context): Promise<QueryResult> {
    if (hasNullValueInFilters(queryOptions, 'delete_rows')) {
      return {
        status: 'failed',
        errorMessage: 'Null value comparison not allowed, To check null values Please use IS operator instead.',
        data: {},
      };
    }
    const { table_id: tableId, delete_rows: deleteRows = { whereFilters: {} } } = queryOptions;
    const {
      where_filters: whereFilters,
      limit = 1,
      order_column: orderColumn,
      order_column_id: orderColumnId,
    } = deleteRows;
    const { organization_id: organizationId, environment_id: environmentId } = context.app;

    const query = [];
    const resolvedWhereFilters = await this.resolveFilterColumns(organizationId, tableId, whereFilters, environmentId);
    const whereQuery = buildPostgrestQuery(resolvedWhereFilters);
    if (isEmpty(whereQuery)) {
      return {
        status: 'failed',
        errorMessage: 'Please provide a where filter or a limit to delete rows',
        data: {},
      };
    }

    if (limit && isNaN(limit)) {
      throw new QueryError('An incorrect limit value.', 'Limit should be a valid integer', {});
    }

    if (!isEmpty(whereQuery)) query.push(whereQuery);

    if (limit && limit !== '') {
      query.push(`limit=${limit}`);
      const resolvedOrderColumn = await this.resolveColumnName(
        organizationId,
        tableId,
        { column: orderColumn, columnId: orderColumnId },
        environmentId
      );
      if (resolvedOrderColumn) {
        query.push(`order=${resolvedOrderColumn}`);
      }
    }

    const headers = { 'data-query-id': queryOptions.id, 'tj-workspace-id': organizationId };
    const url = maybeSetSubPath(`/api/tooljet-db/proxy/${tableId}?` + query.join('&'));
    return await this.proxyPostgrest(url, 'DELETE', headers, {}, environmentId);
  }

  async joinTables(queryOptions, context): Promise<QueryResult> {
    const { organization_id: organizationId, environment_id: environmentId } = context.app;
    const { join_table = {} } = queryOptions;

    // Empty Input is restricted
    if (Object.keys(join_table).length === 0) {
      return {
        status: 'failed',
        errorMessage: `Input can't be empty`,
        data: {},
      };
    }

    const sanitizedJoinTableJson = { ...join_table };
    // If mandatory fields ( Select, Join & From section ), are empty throw error
    const mandatoryFieldsButEmpty = [];
    if (!sanitizedJoinTableJson?.fields.length && isEmpty(sanitizedJoinTableJson.aggregates))
      mandatoryFieldsButEmpty.push('Select and Aggregate');
    if (sanitizedJoinTableJson?.from && !Object.keys(sanitizedJoinTableJson?.from).length)
      mandatoryFieldsButEmpty.push('From');

    if (mandatoryFieldsButEmpty.length) {
      return {
        status: 'failed',
        errorMessage: `Empty values are found in the following section - ${mandatoryFieldsButEmpty.join(', ')}.`,
        data: {},
      };
    }

    if (sanitizedJoinTableJson.limit && isNaN(sanitizedJoinTableJson.limit)) {
      throw new QueryError('An incorrect limit value.', 'Limit should be a valid integer', {});
    }

    if (sanitizedJoinTableJson.offset && isNaN(sanitizedJoinTableJson.offset)) {
      throw new QueryError('An incorrect offset value.', 'Offset should be a valid integer', {});
    }

    // If non-mandatory fields ( Filter & Sort ) are empty - remove the particular field
    if (
      sanitizedJoinTableJson?.conditions &&
      (!Object.keys(sanitizedJoinTableJson?.conditions)?.length ||
        !sanitizedJoinTableJson?.conditions?.conditionsList?.length)
    ) {
      delete sanitizedJoinTableJson.conditions;
    }

    // Sanitise the GroupBy and Aggregate JSON properly
    if (sanitizedJoinTableJson.group_by && !Object.keys(sanitizedJoinTableJson.group_by)?.length) {
      delete sanitizedJoinTableJson.group_by;
    }

    if (sanitizedJoinTableJson.aggregates && !Object.keys(sanitizedJoinTableJson.aggregates)?.length) {
      delete sanitizedJoinTableJson.aggregates;
    }

    if (sanitizedJoinTableJson?.order_by && !sanitizedJoinTableJson?.order_by.length)
      delete sanitizedJoinTableJson.order_by;

    const resolvedJoinTableJson = await this.resolveJoinColumns(organizationId, sanitizedJoinTableJson, environmentId);

    const result = await this.tableOperationsService.perform(
      organizationId,
      'join_tables',
      {
        joinQueryJson: resolvedJoinTableJson,
      },
      environmentId
    );

    return { status: 'ok', data: result };
  }

  async sqlExecution(queryOptions, context): Promise<QueryResult> {
    if (isSQLModeDisabled())
      throw new QueryError('SQL execution is disabled', 'Contact Admin to enable SQL execution', {});

    const { organization_id: organizationId, environment_id: environmentId } = context.app;
    const { sql_execution: sqlExecution = {} } = queryOptions;
    const { sqlQuery = '' } = sqlExecution;
    if (isEmpty(sqlQuery)) return;

    // Check for Workspace
    const workspaceDetails = await this.manager.findOne(Organization, {
      where: { id: organizationId },
    });
    if (!workspaceDetails) throw new NotFoundException(`Workspace doesn't exists`);

    // Check for Tjdb Configuration
    const tjdbTenantConfigs = await this.manager.findOne(OrganizationTjdbConfigurations, {
      where: { organizationId },
    });
    if (!tjdbTenantConfigs) throw new NotFoundException(`Tooljet database schema configuration doesn't exists`);

    const { pgPassword, pgUser } = tjdbTenantConfigs;
    const tjdbPassKey = await decryptTooljetDatabasePassword(pgPassword);
    const tenantSchema = findTenantSchema(organizationId);
    const { tooljetDbTenantConnection } = await createTooljetDatabaseConnection(tjdbPassKey, pgUser, tenantSchema);

    let ast;
    let tableList;
    const sqlParser = new Parser();

    try {
      const parsedSQL = sqlParser.parse(sqlQuery);
      ast = parsedSQL.ast;
      tableList = parsedSQL.tableList;
    } catch (error) {
      return {
        status: 'failed',
        errorMessage: 'Syntax error encountered',
        data: { name: error?.name, message: error?.message },
      };
    }

    const internalTableInfo = [];

    try {
      // Operation AllowList check
      const isValidCommand = await this.checkCommandAllowlist(ast);
      if (!isValidCommand) throw new Error('This SQL functionality is restricted.');

      // Updating SearchPath for a session
      await tooljetDbTenantConnection.query(`SET search_path TO "${tenantSchema}"`);

      const { tablesUsedInQuery, tableAndSchemaList } = this.parseTableListFromASTParser(tableList);
      // Validate tables exist in workspace before resolving physical names - this owns the
      // "table doesn't exist" error message, and resolveTable's own NotFoundException (thrown by
      // its internal findOne, redone below) would replace that message with a worse one.
      await this.verifyTablesExistInWorkspace(tablesUsedInQuery, organizationId);
      const internalTableNameToRelationIdMap = await this.resolveTableNameToRelationIdMap(
        tablesUsedInQuery,
        organizationId,
        environmentId,
        internalTableInfo
      );

      await this.validateSchemaAndTablePrivileges(
        this.tooljetDbManager,
        tenantSchema,
        pgUser,
        tableAndSchemaList,
        internalTableNameToRelationIdMap
      );

      this.parseTableNameInAST(ast, internalTableNameToRelationIdMap);
      const validSql = sqlParser.sqlify(ast);
      const results = await tooljetDbTenantConnection.query(validSql);
      return { status: 'ok', data: results };
    } catch (error) {
      const modifiedErrorObj = modifyTjdbErrorObject(error);
      const errorObj = new QueryFailedError(error, [], new PostgrestError(modifiedErrorObj));
      const tjdbErrorObj = new TooljetDatabaseError(
        error.message,
        {
          origin: 'sql_execution',
          internalTables: internalTableInfo,
        },
        errorObj
      );
      const alteredErrorMessage = tjdbErrorObj.toString();
      throw new QueryError(alteredErrorMessage, alteredErrorMessage, {});
    } finally {
      await tooljetDbTenantConnection.destroy();
    }
  }

  /**
   * Helper function to UPDATE TableName with its relation id in the parsed sql (AST)
   * @param parsedSql - AST Json for SQL
   * @param internalTableNameToRelationIdMap - Object which holds tablename and its respective relation id
   */
  protected parseTableNameInAST(parsedSql, internalTableNameToRelationIdMap) {
    if (Array.isArray(parsedSql)) {
      parsedSql.forEach((item) => this.parseTableNameInAST(item, internalTableNameToRelationIdMap));
    } else if (typeof parsedSql === 'object' && parsedSql !== null) {
      if (parsedSql['table'] && !isEmpty(internalTableNameToRelationIdMap)) {
        parsedSql.table = internalTableNameToRelationIdMap[parsedSql.table]
          ? internalTableNameToRelationIdMap[parsedSql.table]
          : parsedSql.table;
      }
      Object.keys(parsedSql).forEach((key) => {
        this.parseTableNameInAST(parsedSql[key], internalTableNameToRelationIdMap);
      });
    }
  }

  /**
   * Resolves each display name used in a SQL-mode query to the relation id naming its current
   * physical table, via TooljetDbTableOperationsService.resolveTable - the single door from a
   * display name to a physical name. Kept as its own method (rather than inline in sqlExecution)
   * so the map construction can be unit-tested without going through AST parsing or opening a
   * Postgres connection.
   *
   * Call only after verifyTablesExistInWorkspace has confirmed every name in tablesUsedInQuery
   * belongs to this workspace - resolveTable does its own (redundant, accepted) existence check
   * and would surface a worse-worded NotFoundException first otherwise.
   *
   * @param tablesUsedInQuery - display names, from parseTableListFromASTParser
   * @param organizationId - Workspace id
   * @param environmentId - environment to resolve each display name's relation in
   * @param internalTableInfo - accumulator mutated in place with { id: relationId, tableName } as
   *   each table resolves, so it is populated for TooljetDatabaseError's error-translation context
   *   even if resolution fails partway through the list
   * @returns display name -> relation id
   */
  protected async resolveTableNameToRelationIdMap(
    tablesUsedInQuery: Array<string>,
    organizationId: string,
    environmentId: string | undefined,
    internalTableInfo: Array<{ id: string; tableName: string }>
  ): Promise<Record<string, string>> {
    const internalTableNameToRelationIdMap: Record<string, string> = {};
    for (const tableName of tablesUsedInQuery) {
      const { relation } = await this.tableOperationsService.resolveTable(
        organizationId,
        tableName,
        environmentId,
        this.manager
      );
      internalTableInfo.push({ id: relation.id, tableName });
      internalTableNameToRelationIdMap[tableName] = relation.id;
    }
    return internalTableNameToRelationIdMap;
  }

  /**
   * Function to validate, if SQL operations are in allowlist else it is invalid SQL command.
   * @param parsedSqlAst
   * @returns boolean
   */
  protected checkCommandAllowlist(parsedSqlAst: AST[] | AST): boolean {
    const allowList = ['select', 'insert', 'update', 'delete', 'transaction'];
    let isValidCommand = true;
    if (Array.isArray(parsedSqlAst)) {
      parsedSqlAst.forEach((sqlExpression) => {
        if (!allowList.includes(sqlExpression.type)) isValidCommand = false;
      });
    }

    if (!Array.isArray(parsedSqlAst) && parsedSqlAst.type) {
      if (!allowList.includes(parsedSqlAst.type)) isValidCommand = false;
    }
    return isValidCommand;
  }

  /**
   * Function to verify that all the tables mentioned in the SQL query are exists and valid.
   * @param tablesUsedInquery - Table names in list
   * @param organizationId - Workspace id
   * @returns Table details as list.
   */
  protected async verifyTablesExistInWorkspace(tablesUsedInquery: Array<string>, organizationId: string) {
    const tableDetailsInList = await this.manager.find(InternalTable, {
      where: {
        organizationId: organizationId,
        tableName: In(tablesUsedInquery),
      },
    });
    const tableList = tableDetailsInList.map((table) => table.tableName);
    const tablesNotInOrg = tablesUsedInquery.filter((tableName) => !tableList.includes(tableName));
    if (isEmpty(tablesNotInOrg)) return tableDetailsInList;
    throw new NotFoundException(`Table: ${tablesNotInOrg.join(', ')} not found`);
  }

  /**
   * Function to parse tableList from SQL parser, which will be in specific format like <statement_type>::<schema>::<table>.
   * This function splits the mentioned format into schema and table separately.
   * @param tableList - Strings in list - String format will be <statement_type>::<schema>::<table>
   * @returns
   */
  protected parseTableListFromASTParser(tableList: Array<string>): {
    tablesUsedInQuery: Array<string>;
    tableAndSchemaList: Array<{ schema: string; table: string }>;
  } {
    const tablesUsedInQuery = [];
    const results = tableList.map((parsedTable) => {
      const separatedString = parsedTable.split('::');
      if (!isEmpty(separatedString[2])) tablesUsedInQuery.push(separatedString[2]);
      return { schema: separatedString[1] !== 'null' ? separatedString[1] : null, table: separatedString[2] };
    });
    return { tablesUsedInQuery: tablesUsedInQuery, tableAndSchemaList: results };
  }

  /**
   * Function to validate Access to Schema and Tables mentioned in query for the Tenant user.
   * @param tooljetDbManager
   * @param tenantSchema - Schema for specific workspace.
   * @param pgUser - Tenant user
   * @param tableAndSchemaList
   * @param internalTableNameToRelationIdMap
   */
  protected async validateSchemaAndTablePrivileges(
    tooljetDbManager: EntityManager,
    tenantSchema: string,
    pgUser: string,
    tableAndSchemaList: Array<{ schema: string; table: string }>,
    internalTableNameToRelationIdMap
  ) {
    // Validates if Tenant User has access to Workspace Schema.
    await this.validateSchemaPrivileges(tooljetDbManager, pgUser, tenantSchema);
    for (const tableAndSchema of tableAndSchemaList) {
      const { schema, table } = tableAndSchema;
      if (schema) await this.validateSchemaPrivileges(tooljetDbManager, pgUser, schema);
      if (!isEmpty(internalTableNameToRelationIdMap[table]))
        await this.validateUserHasTablePrivileges(
          internalTableNameToRelationIdMap,
          tooljetDbManager,
          pgUser,
          schema,
          table,
          tenantSchema
        );
    }
  }

  protected async validateSchemaPrivileges(tooljetDbManager: EntityManager, pgUser: string, schema: string) {
    const [{ has_schema_privilege }] = await tooljetDbManager.query(
      `SELECT has_schema_privilege('${pgUser}', '${schema}', 'USAGE')`
    );
    if (!has_schema_privilege) throw new Error('You are not authorized to perform actions on some schemas.');
  }

  protected async validateUserHasTablePrivileges(
    internalTableNameToRelationIdMap,
    tooljetDbManager: EntityManager,
    pgUser: string,
    schema: string,
    tableName: string,
    tenantSchema: string
  ) {
    const queryToExecute = schema
      ? `SELECT has_table_privilege('${pgUser}', '${schema}.${internalTableNameToRelationIdMap[tableName]}', 'SELECT')`
      : `SELECT has_table_privilege('${pgUser}', '${tenantSchema}.${internalTableNameToRelationIdMap[tableName]}', 'SELECT')`;
    const [{ has_table_privilege }] = await tooljetDbManager.query(queryToExecute);
    if (!has_table_privilege) throw new Error('TJDB table permission denied');
  }

  protected buildAggregateAndGroupByQuery(
    tableName: string,
    aggregates: { [key: string]: { aggFx: string; column: string } },
    groupBy: { [key: string]: Array<string> }
  ) {
    enum AggregateFunctions {
      sum = 'sum',
      count = 'count',
    }

    const query = [];
    if (!isEmpty(aggregates)) {
      Object.entries(aggregates).forEach(([_key, aggregateDetail]) => {
        const { aggFx, column } = aggregateDetail;
        if (isEmpty(column) || isEmpty(aggFx))
          throw new Error('There are empty values in certain aggregate conditions.');
        if (aggFx && column) query.push(`${tableName}_${column}_${aggFx}:${column}.${AggregateFunctions[aggFx]}()`);
      });
    }

    if (!isEmpty(groupBy)) {
      Object.entries(groupBy).forEach(([_key, groupByColumList]) => {
        if (!isEmpty(groupByColumList)) query.push(...groupByColumList);
      });
    }

    return query;
  }

  async bulkUpsertUsingPrimaryKey(queryOptions, context): Promise<QueryResult> {
    if (hasNullValueInFilters(queryOptions, 'bulk_upsert_with_primary_key')) {
      return {
        status: 'failed',
        errorMessage: 'Null value comparison not allowed. To check null values, please use IS operator instead.',
        data: {},
      };
    }

    try {
      const { table_id: tableId, bulk_upsert_with_primary_key: bulkUpsertOptions } = queryOptions;
      const {
        primary_key: primaryKeyColumns,
        primary_key_ids: primaryKeyColumnIds,
        rows: rowsToUpsert,
      } = bulkUpsertOptions;
      const { organization_id: organizationId, environment_id: environmentId } = context.app;

      // Validate input
      if (!Array.isArray(rowsToUpsert) || rowsToUpsert.length === 0) {
        return {
          status: 'failed',
          errorMessage: 'No rows provided for upsert operation',
          data: {},
        };
      }

      if (!Array.isArray(primaryKeyColumns) || primaryKeyColumns.length === 0) {
        return {
          status: 'failed',
          errorMessage: 'No primary key columns specified',
          data: {},
        };
      }

      const resolvedPrimaryKeyColumns = await this.resolveColumnNames(
        organizationId,
        tableId,
        primaryKeyColumns.map((column, index) => ({ column, columnId: primaryKeyColumnIds?.[index] })),
        environmentId
      );

      // Perform bulk upsert
      const result = await this.tooljetDbBulkUploadService.bulkUpsertRowsWithPrimaryKey(
        rowsToUpsert,
        tableId,
        resolvedPrimaryKeyColumns,
        organizationId,
        environmentId
      );

      if (result.status === 'failed') {
        return {
          status: 'failed',
          errorMessage: result.error,
          data: {},
        };
      }

      return {
        status: 'ok',
        data: {
          inserted: result.inserted,
          updated: result.updated,
          data: result.rows,
        },
      };
    } catch (error) {
      return {
        status: 'failed',
        errorMessage: error.message,
        data: {},
      };
    }
  }
}

function hasNullValueInFilters(queryOptions, operation) {
  const filters = queryOptions.operation?.where_filters;
  if (filters) {
    const filterKeys = Object.keys(filters);
    for (let i = 0; i < filterKeys.length; i++) {
      const filter = filters[filterKeys[i]];
      if (filter.operator !== 'is' && filter.value === null) {
        return true;
      }
    }
  }
  return false;
}

function buildPostgrestQuery(filters) {
  if (isEmpty(filters)) return null;

  const postgrestQueryBuilder = new PostgrestQueryBuilder();

  Object.keys(filters).map((key) => {
    if (!isEmpty(filters[key])) {
      const { column, operator, value, order, jsonpath = '' } = filters[key];

      if (!isEmpty(column) && !isEmpty(order)) {
        const columnName = jsonpath ? `${column}${jsonpath}` : column;
        postgrestQueryBuilder.order(columnName, order);
      }

      if (!isEmpty(column) && !isEmpty(operator)) {
        const columnName = jsonpath ? `${column}${jsonpath}` : column;
        postgrestQueryBuilder[operator](columnName, value);
      }
    }
  });
  return postgrestQueryBuilder.url.toString();
}
