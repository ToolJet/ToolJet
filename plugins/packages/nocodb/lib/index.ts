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
    const tableId = queryOptions.table_id;
    const apiToken = sourceOptions.api_token;
    const host = sourceOptions.nocodb_host;
    const baseURL = host === 'nocodb_cloud' ? 'https://app.nocodb.com' : sourceOptions.base_url;

    try {
      switch (operation) {
        case 'list_records': {
          response = await got(`${baseURL}/api/v2/tables/${tableId}/records`, {
            method: 'get',
            headers: this.authHeader(apiToken),
          });

          result = this.parseJSON(response.body);
          break;
        }

        case 'get_count': {
          response = await got(`${baseURL}/api/v2/tables/${tableId}/records/count`, {
            method: 'get',
            headers: this.authHeader(apiToken),
          });

          result = this.parseJSON(response.body);
          break;
        }

        case 'get_record': {
          const record_id = queryOptions.record_id;
          response = await got(`${baseURL}/api/v2/tables/${tableId}/records/${record_id}`, {
            method: 'get',
            headers: this.authHeader(apiToken),
          });

          result = this.parseJSON(response.body);
          break;
        }

        case 'create_record': {
          response = await got(`${baseURL}/api/v2/tables/${tableId}/records`, {
            method: 'post',
            headers: this.authHeader(apiToken),
            json: this.parseJSON(queryOptions.body),
          });

          result = this.parseJSON(response.body);
          break;
        }

        case 'update_record': {
          const record_id = queryOptions.record_id;
          response = await got(`${baseURL}/api/v2/tables/${tableId}/records`, {
            method: 'patch',
            headers: this.authHeader(apiToken),
            json: {
              ...this.parseJSON(queryOptions.body),
              Id: record_id,
            },
          });

          result = this.parseJSON(response.body);
          break;
        }

        case 'delete_record': {
          const record_id = queryOptions.record_id;
          response = await got(`${baseURL}/api/v2/tables/${tableId}/records`, {
            method: 'delete',
            headers: this.authHeader(apiToken),
            json: {
              Id: record_id,
            },
          });

          result = this.parseJSON(response.body);
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
