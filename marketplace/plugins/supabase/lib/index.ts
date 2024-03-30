import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { createClient } from '@supabase/supabase-js';
import { SourceOptions, QueryOptions, Column, Filter, Sort } from './types';

export default class Supabase implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const supabaseClient = await this.getConnection(sourceOptions);
    const operation = queryOptions.operation;
    let result = {};
    let error: any = false;
    try {
      if (!operation) throw new Error('Select one operation');
      const { get_table_name, create_table_name, update_table_name, delete_table_name, count_table_name } =
        queryOptions;
      const tableNameValues = {
        get_rows: get_table_name,
        create_row: create_table_name,
        update_row: update_table_name,
        delete_row: delete_table_name,
        count_rows: count_table_name,
      };
      if (!tableNameValues[operation]) throw new Error('Table name is required');
      let res: any;
      switch (operation) {
        case 'get_rows':
          res = await this.getRows(queryOptions, supabaseClient);
          error = res.error;
          result = res.data;
          break;
        case 'create_row':
          res = await this.createRows(queryOptions, supabaseClient);
          error = res.error;
          result = { created: true };
          break;
        case 'update_row':
          res = await this.updateRows(queryOptions, supabaseClient);
          error = res.error;
          result = res.data;
          break;
        case 'delete_row':
          res = await this.deleteRows(queryOptions, supabaseClient);
          error = res.error;
          result = { deleted: true };
          break;
        case 'count_rows':
          res = await this.countRows(queryOptions, supabaseClient);
          error = res.error;
          result = res.data;
          if (Array.isArray(result)) {
            result = result[0];
          }
          break;
        default:
          break;
      }
    } catch (err) {
      throw new QueryError('Query could not be completed', err.message, {});
    }

    if (error) {
      throw new QueryError('Query could not be completed', error, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async getRows(queryOptions: QueryOptions, supabaseClient: any) {
    const { get_table_name, get_filters, get_sort, get_limit } = queryOptions;

    let query: any = supabaseClient.from(get_table_name).select();
    if (get_filters) {
      const getFiltersData: Filter[] = Object.values(get_filters);
      this.addQueryFilters(query, getFiltersData);
    }
    if (get_sort) {
      const getSorts: Sort[] = Object.values(get_sort);
      this.addQuerySort(query, getSorts);
    }
    if (get_limit) {
      query = query.limit(Number(get_limit));
    }
    const res: any = await query;
    return res;
  }

  async createRows(queryOptions: QueryOptions, supabaseClient: any) {
    const { create_table_name, create_body } = queryOptions;
    if (!create_body) throw new Error('Body required to create rows in table');
    const res: any = await supabaseClient.from(create_table_name).insert(JSON.parse(create_body));
    return res;
  }

  async updateRows(queryOptions: QueryOptions, supabaseClient: any) {
    const { update_table_name, update_filters, update_column_fields } = queryOptions;
    if (!update_table_name) throw new Error('Table name field is required');
    if (!update_column_fields) throw new Error('No column(s) provided to update');

    const updateColumnValues: Column[] = Object.values(update_column_fields);
    if (!updateColumnValues.length) throw new Error('No column(s) provided to update');

    const columnNames: string[] = updateColumnValues.map((item) => item.column).filter((columnName) => !!columnName);
    if (!columnNames.length) throw new Error('Provide column(s) with valid data');

    const isDuplicate: boolean = columnNames.some((item, idx) => columnNames.indexOf(item) != idx);
    if (isDuplicate) {
      throw new Error('Duplicate column keys are not allowed');
    }
    const updateQuery: any = supabaseClient.from(update_table_name).select();
    if (update_filters) {
      const updateFiltersData: Filter[] = Object.values(update_filters);
      this.addQueryFilters(updateQuery, updateFiltersData);
    }
    let updateQueryRes: any = await updateQuery;
    if (updateQueryRes.error) throw new Error('Failed to fetch table rows to update');

    const columnsData: object = {};
    updateColumnValues.forEach((columnObj) => {
      columnsData[columnObj.column] = columnObj.value;
    });
    updateQueryRes = updateQueryRes.data.map((data: any) => ({ ...data, ...columnsData }));
    updateQueryRes = await supabaseClient.from(update_table_name).upsert(updateQueryRes).select();
    return updateQueryRes;
  }

  async deleteRows(queryOptions: QueryOptions, supabaseClient: any) {
    const { delete_table_name, delete_filters, delete_sort, delete_limit } = queryOptions;
    let deleteQuery: any = supabaseClient.from(delete_table_name).delete();
    if (delete_filters) {
      const deleteFiltersData: Filter[] = Object.values(delete_filters);
      this.addQueryFilters(deleteQuery, deleteFiltersData);
    }
    if (delete_sort) {
      const deleteSorts: Sort[] = Object.values(delete_sort);
      this.addQuerySort(deleteQuery, deleteSorts);
    }
    if (delete_limit) {
      deleteQuery = deleteQuery.limit(Number(delete_limit));
    }
    const res: any = await deleteQuery;
    return res;
  }

  async countRows(queryOptions: QueryOptions, supabaseClient: any) {
    const { count_table_name, count_filters } = queryOptions;
    const countQuery: any = supabaseClient.from(count_table_name).select('count', { count: 'exact' });
    if (count_filters) {
      const countFiltersData: Filter[] = Object.values(count_filters);
      this.addQueryFilters(countQuery, countFiltersData);
    }
    const res: any = await countQuery;
    return res;
  }

  addQueryFilters(query: any, filters: Filter[]) {
    filters.forEach((filter: any) => {
      const { operator, column, value } = filter;
      if (operator === '==') {
        query = query.eq(column, value);
      } else if (operator === '!=') {
        query = query.neq(column, value);
      } else if (operator === '<') {
        query = query.lt(column, value);
      } else if (operator === '>') {
        query = query.gt(column, value);
      } else if (operator === '<=') {
        query = query.lte(column, value);
      } else if (operator === '>=') {
        query = query.gte(column, value);
      } else if (operator === 'is') {
        query = query.is(column, value);
      } else if (operator === 'in') {
        query = query.in(column, JSON.parse(value));
      } else if (operator === 'is not') {
        query = query.not(column, 'is', value);
      }
    });
  }

  addQuerySort(query: any, sorts: Sort[]) {
    sorts.forEach((sort: any) => {
      const { column, order } = sort;
      query = query.order(column, { ascending: order === 'ascend' });
    });
  }

  async getConnection(sourceOptions: SourceOptions, _options?: object): Promise<any> {
    const { project_url, service_role_secret } = sourceOptions;
    // Create a single supabase client for interacting with your database
    const supabaseClient = createClient(project_url, service_role_secret);

    return supabaseClient;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const supabaseClient = await this.getConnection(sourceOptions);

    if (!supabaseClient) {
      throw new Error('Invalid credentials');
    }

    return {
      status: 'ok',
    };
  }
}
