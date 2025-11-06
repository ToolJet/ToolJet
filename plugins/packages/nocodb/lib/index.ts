import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import got, { Headers } from 'got';
const JSON5 = require('json5');

export default class Nocodb implements QueryService {
  private authHeader(token: string): Headers {
    return { 'xc-token': token, 'Content-Type': 'application/json' };
  }

  private parseJSON(json?: string): object {
    if (!json) return {};
    return JSON5.parse(json);
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result = {};
    let response = null;
    const operation = queryOptions.operation;
    const baseId = queryOptions.base_id;
    const tableId = queryOptions.table_id;
    const apiToken = sourceOptions.api_token;
    const host = sourceOptions.nocodb_host;
    const apiVersion = sourceOptions.api_version;
    const baseURL = host === 'nocodb_cloud' ? 'https://app.nocodb.com' : sourceOptions.base_url;

    let query_string = queryOptions.query_string || '';
    if (query_string[0] === '?') {
      query_string = query_string.slice(1);
    }
    try {
      switch (operation) {
        case 'list_records': {
          const url =
            apiVersion === 'v3'
              ? `${baseURL}/api/v3/data/${baseId}/${tableId}/records?${query_string}`
              : `${baseURL}/api/v2/tables/${tableId}/records?${query_string}`;
          response = await got(url, {
            method: 'get',
            headers: this.authHeader(apiToken),
          });

          result = this.parseJSON(response.body);
          break;
        }

        case 'get_count': {
          const url =
            apiVersion === 'v3'
              ? `${baseURL}/api/v3/data/${baseId}/${tableId}/records?${query_string}`
              : `${baseURL}/api/v2/tables/${tableId}/records?${query_string}`;
          response = await got(url, {
            method: 'get',
            headers: this.authHeader(apiToken),
          });

          result = this.parseJSON(response.body);
          break;
        }

        case 'get_record': {
          const record_id = queryOptions.record_id;
          const url =
            apiVersion === 'v3'
              ? `${baseURL}/api/v3/data/${baseId}/${tableId}/records/${record_id}?${query_string}`
              : `${baseURL}/api/v2/tables/${tableId}/records/${record_id}?${query_string}`;
          response = await got(url, {
            method: 'get',
            headers: this.authHeader(apiToken),
          });

          result = this.parseJSON(response.body);
          break;
        }

        case 'create_record': {
          const url =
            apiVersion === 'v3'
              ? `${baseURL}/api/v3/data/${baseId}/${tableId}/records`
              : `${baseURL}/api/v2/tables/${tableId}/records`;
          response = await got(url, {
            method: 'post',
            headers: this.authHeader(apiToken),
            json:
              apiVersion === 'v3' ? { fields: this.parseJSON(queryOptions.body) } : this.parseJSON(queryOptions.body),
          });

          result = this.parseJSON(response.body);
          if (apiVersion === 'v3') {
            result = (result as any).records?.[0] ?? result;
          }
          break;
        }

        case 'update_record': {
          const record_id = Number(queryOptions.record_id) ?? 0;
          const url =
            apiVersion === 'v3'
              ? `${baseURL}/api/v3/data/${baseId}/${tableId}/records`
              : `${baseURL}/api/v2/tables/${tableId}/records`;
          response = await got(url, {
            method: 'patch',
            headers: this.authHeader(apiToken),
            json:
              apiVersion === 'v3'
                ? { id: record_id, fields: this.parseJSON(queryOptions.body) }
                : {
                    ...this.parseJSON(queryOptions.body),
                    Id: record_id,
                  },
          });

          result = this.parseJSON(response.body);
          if (apiVersion === 'v3') {
            result = (result as any).records?.[0] ?? result;
          }
          break;
        }

        case 'delete_record': {
          const record_id = Number(queryOptions.record_id) ?? 0;
          const url =
            apiVersion === 'v3'
              ? `${baseURL}/api/v3/data/${baseId}/${tableId}/records`
              : `${baseURL}/api/v2/tables/${tableId}/records`;
          response = await got(url, {
            method: 'delete',
            headers: this.authHeader(apiToken),
            json:
              apiVersion === 'v3'
                ? { id: record_id }
                : {
                    Id: record_id,
                  },
          });

          result = this.parseJSON(response.body);
          if (apiVersion === 'v3') {
            result = (result as any).records?.[0] ?? result;
          }
          break;
        }
      }
    } catch (error) {
      console.log(error);
      throw new QueryError('Query could not be completed', error.message, {});
    }
    return {
      status: 'ok',
      data: result,
    };
  }
}
