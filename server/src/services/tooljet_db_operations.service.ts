import { Injectable } from '@nestjs/common';
import PostgrestQueryBuilder from 'src/helpers/postgrest_query_builder';
import { QueryService, QueryResult } from '@tooljet/plugins/dist/packages/common/lib';
import { TooljetDbService } from './tooljet_db.service';
import { isEmpty } from 'lodash';
import { PostgrestProxyService } from './postgrest_proxy.service';
import { ConfigService } from '@nestjs/config';

// This service encapsulates all TJDB data manipulation operations
// which can act like any other datasource
@Injectable()
export class TooljetDbOperationsService implements QueryService {
  constructor(
    private tooljetDbService: TooljetDbService,
    private postgrestProxyService: PostgrestProxyService,
    private configService: ConfigService
  ) {}

  async run(_sourceOptions, queryOptions, _dataSourceCacheId, _dataSourceCacheUpdatedAt): Promise<QueryResult> {
    switch (queryOptions.operation) {
      case 'list_rows':
        return this.listRows(queryOptions);
      case 'create_row':
        return this.createRow(queryOptions);
      case 'update_rows':
        return this.updateRows(queryOptions);
      case 'delete_rows':
        return this.deleteRows(queryOptions);
      case 'join_tables':
        // custom implementation without PostgREST
        return this.joinTables(queryOptions);

      default:
        return {
          status: 'failed',
          data: {},
          errorMessage: 'Invalid operation',
        };
    }
  }

  private async proxyPostgrest(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    headers: Record<string, string>,
    body: Record<string, any> = {}
  ): Promise<QueryResult> {
    const result = await this.postgrestProxyService.perform(url, method, headers, body);

    return { status: 'ok', data: result };
  }

  async listRows(queryOptions): Promise<QueryResult> {
    if (hasNullValueInFilters(queryOptions, 'list_rows')) {
      return {
        status: 'failed',
        errorMessage: 'Null value comparison not allowed, To check null values Please use IS operator instead.',
        data: {},
      };
    }
    const { table_id: tableId, list_rows: listRows } = queryOptions;
    const query = [];

    if (!isEmpty(listRows)) {
      const { limit, where_filters: whereFilters, order_filters: orderFilters, offset } = listRows;

      if (limit && isNaN(limit)) {
        return {
          status: 'failed',
          errorMessage: 'Limit should be a number.',
          data: {},
        };
      }

      const whereQuery = buildPostgrestQuery(whereFilters);
      const orderQuery = buildPostgrestQuery(orderFilters);

      !isEmpty(whereQuery) && query.push(whereQuery);
      !isEmpty(orderQuery) && query.push(orderQuery);
      !isEmpty(limit) && query.push(`limit=${limit}`);
      !isEmpty(offset) && query.push(`offset=${offset}`);
    }
    const headers = { 'data-query-id': queryOptions.id, 'tj-workspace-id': queryOptions.organization_id };
    const url = `/api/tooljet-db/proxy/${tableId}` + `?${query}`;

    return await this.proxyPostgrest(url, 'GET', headers);
  }

  async createRow(queryOptions): Promise<QueryResult> {
    const columns = Object.values(queryOptions.create_row).reduce((acc, colOpts: { column: string; value: any }) => {
      if (isEmpty(colOpts.column)) return acc;
      return Object.assign(acc, { [colOpts.column]: colOpts.value });
    }, {});

    const headers = { 'data-query-id': queryOptions.id, 'tj-workspace-id': queryOptions.organization_id };

    const url = `/api/tooljet-db/proxy/${queryOptions.table_id}`;
    return await this.proxyPostgrest(url, 'POST', headers, columns);
  }

  async updateRows(queryOptions): Promise<QueryResult> {
    if (hasNullValueInFilters(queryOptions, 'update_rows')) {
      return {
        status: 'failed',
        errorMessage: 'Null value comparison not allowed, To check null values Please use IS operator instead.',
        data: {},
      };
    }
    const { table_id: tableId, update_rows: updateRows } = queryOptions;
    const { where_filters: whereFilters, columns } = updateRows;

    const query = [];
    const whereQuery = buildPostgrestQuery(whereFilters);
    const body = Object.values<{ column: string; value: any }>(columns).reduce((acc, colOpts) => {
      if (isEmpty(colOpts.column)) return acc;
      return Object.assign(acc, { [colOpts.column]: colOpts.value });
    }, {});

    !isEmpty(whereQuery) && query.push(whereQuery);

    const headers = { 'data-query-id': queryOptions.id, 'tj-workspace-id': queryOptions.organization_id };
    const url = `/api/tooljet-db/proxy/${tableId}?` + query.join('&') + '&order=id';
    return await this.proxyPostgrest(url, 'PATCH', headers, body);
  }

  async deleteRows(queryOptions): Promise<QueryResult> {
    if (hasNullValueInFilters(queryOptions, 'delete_rows')) {
      return {
        status: 'failed',
        errorMessage: 'Null value comparison not allowed, To check null values Please use IS operator instead.',
        data: {},
      };
    }
    const { table_id: tableId, delete_rows: deleteRows = { whereFilters: {} } } = queryOptions;
    const { where_filters: whereFilters, limit = 1 } = deleteRows;

    const query = [];
    const whereQuery = buildPostgrestQuery(whereFilters);
    if (isEmpty(whereQuery)) {
      return {
        status: 'failed',
        errorMessage: 'Please provide a where filter or a limit to delete rows',
        data: {},
      };
    }

    if (limit && isNaN(limit)) {
      return {
        status: 'failed',
        errorMessage: 'Limit should be a number',
        data: {},
      };
    }

    !isEmpty(whereQuery) && query.push(whereQuery);
    limit && limit !== '' && query.push(`limit=${limit}&order=id`);

    const headers = { 'data-query-id': queryOptions.id, 'tj-workspace-id': queryOptions.organization_id };
    const url = `/api/tooljet-db/proxy/${tableId}?` + query.join('&');
    return await this.proxyPostgrest(url, 'DELETE', headers);
  }

  async joinTables(queryOptions): Promise<QueryResult> {
    const organizationId = queryOptions.organization_id;
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
    if (!sanitizedJoinTableJson?.fields.length) mandatoryFieldsButEmpty.push('Select');
    if (sanitizedJoinTableJson?.from && !Object.keys(sanitizedJoinTableJson?.from).length)
      mandatoryFieldsButEmpty.push('From');
    if (mandatoryFieldsButEmpty.length) {
      return {
        status: 'failed',
        errorMessage: `Empty values are found in the following section - ${mandatoryFieldsButEmpty.join(', ')}.`,
        data: {},
      };
    }

    // If non-mandatory fields ( Filter & Sort ) are empty - remove the particular field
    if (
      sanitizedJoinTableJson?.conditions &&
      (!Object.keys(sanitizedJoinTableJson?.conditions)?.length ||
        !sanitizedJoinTableJson?.conditions?.conditionsList?.length)
    ) {
      delete sanitizedJoinTableJson.conditions;
    }
    if (sanitizedJoinTableJson?.order_by && !sanitizedJoinTableJson?.order_by.length)
      delete sanitizedJoinTableJson.order_by;

    const result = await this.tooljetDbService.perform(organizationId, 'join_tables', {
      joinQueryJson: sanitizedJoinTableJson,
    });

    return { status: 'ok', data: { result } };
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
      const { column, operator, value, order } = filters[key];

      if (!isEmpty(column) && !isEmpty(order)) {
        postgrestQueryBuilder.order(column, order);
      }

      if (!isEmpty(column) && !isEmpty(operator)) {
        postgrestQueryBuilder[operator](column, value);
      }
    }
  });
  return postgrestQueryBuilder.url.toString();
}
