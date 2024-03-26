import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { createClient } from '@supabase/supabase-js';
import { SourceOptions, QueryOptions } from './types';

export default class Supabase implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const supabaseClient = await this.getConnection(sourceOptions);
    const operation = queryOptions.operation;
    let result = {};
    let error:any = false;

    try {
      switch (operation) {
        case 'get_rows':
          const {get_table_name, get_filters, get_sort, get_limit} = queryOptions;
          const getFiltersData = Object.values(get_filters);
          const getSorts = Object.values(get_sort);
          let query = supabaseClient.from(get_table_name).select();
          this.addQueryFilters(query, getFiltersData);
          this.addQuerySort(query, getSorts);
          if(get_limit){
            query = query.limit(Number(get_limit));
          };
          const getRes = await query;
          error = getRes.error;
          result = getRes.data;
          break;
        case 'create_row':
          const {create_table_name, create_body} = queryOptions;
          const createRes = await supabaseClient.from(create_table_name)
            .insert(JSON.parse(create_body));
          error = createRes.error;
          result = {created: true};
          break;
        case 'update_row':
          const {update_table_name, update_filters, update_column_name, update_column_value} = queryOptions;
          const updateFiltersData = Object.values(update_filters);
          let updateQuery = supabaseClient.from(update_table_name).select();
          this.addQueryFilters(updateQuery, updateFiltersData);
          let updateQueryRes = await updateQuery;
          error = updateQueryRes.error;
          updateQueryRes = updateQueryRes.data.map((data:any) => (
            {...data, [update_column_name]: update_column_value}
          ));
          updateQueryRes = await supabaseClient.from(update_table_name).upsert(updateQueryRes).select();
          error = updateQueryRes.error;
          result = updateQueryRes.data;
          break;
        case 'delete_row':
          const {delete_table_name, delete_filters, delete_sort, delete_limit} = queryOptions;
          const deleteFiltersData = Object.values(delete_filters);
          const deleteSorts = Object.values(delete_sort);
          let deleteQuery = supabaseClient.from(delete_table_name).delete();
          this.addQueryFilters(deleteQuery, deleteFiltersData);
          this.addQuerySort(deleteQuery, deleteSorts);
          if(delete_limit){
            deleteQuery = deleteQuery.limit(Number(delete_limit));
          };
          let deleteQueryRes = await deleteQuery;
          error = deleteQueryRes.error;
          result = {deleted: true};
          break;
        case 'count_rows':
          const {count_table_name, count_filters} = queryOptions;
          const countFiltersData = Object.values(count_filters);
          const countQuery = supabaseClient.from(count_table_name).select('count', { count: 'exact' });
          this.addQueryFilters(countQuery, countFiltersData);
          const countQueryRes = await countQuery;
          error = countQueryRes.error;
          result = countQueryRes.data;
          break;
        default:
          break;
      }
    } catch (err) {
      throw new QueryError('Query could not be completed', err.message, {});
    };

    if(error){
      throw new QueryError('Query could not be completed', error, {});
    };

    return {
      status: 'ok',
      data: result,
    };
  }

  addQueryFilters(query:any, filters:object[]){
    filters.forEach((filter:any) => {
      const {operator, column, value} = filter;
      if(operator === '=='){
        query = query.eq(column, value);
      }else if(operator === '!='){
        query = query.neq(column, value);
      }else if(operator === '<'){
        query = query.lt(column, value);
      }else if(operator === '>'){
        query = query.gt(column, value);
      }else if(operator === '<='){
        query = query.lte(column, value);
      }else if(operator === '>='){
        query = query.gte(column, value);
      }else if(operator === 'is'){
        query = query.is(column, value);
      }else if(operator === 'in'){
        query = query.in(column, [value]);
      }else if(operator === 'is not'){
        query = query.not(column, 'is', value);
      };
    });
  };

  addQuerySort(query:any, sorts:object[]){
    sorts.forEach((sort:any) => {
      const {column, order} = sort;
      query = query.order(column, {ascending: order === 'ascend'});
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
