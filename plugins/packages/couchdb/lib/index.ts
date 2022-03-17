import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import got from 'got';
const JSON5 = require('json5');
export default class Couchdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    let result = {};
    let response = null;
    const { operation, record_id, limit, view_url, start_key, end_key, skip, descending, include_docs } = queryOptions;
    const { username, password, port, host, database, protocol } = sourceOptions;
    const revision_id = queryOptions.rev_id;

    const authHeader = () => {
      const combined = `${username}:${password}`;
      const key = Buffer.from(combined).toString('base64');
      return { Authorization: `Basic ${key}` };
    };

    try {
      switch (operation) {
        case 'list_records': {
          response = await got(`${protocol}://${host}:${port}/${database}/_all_docs`, {
            method: 'get',
            headers: authHeader(),
            searchParams: {
              ...(limit?.length > 0 && { limit }),
              ...(skip?.length > 0 && { skip }),
              ...(descending && { descending }),
              ...(include_docs && { include_docs }),
            },
          });
          result = this.parseJSON(response.body);
          break;
        }

        case 'retrieve_record': {
          response = await got(`${protocol}://${host}:${port}/${database}/${record_id}`, {
            headers: authHeader(),
            method: 'get',
          });
          result = this.parseJSON(response.body);
          break;
        }

        case 'create_record': {
          response = await got(`${protocol}://${host}:${port}/${database}`, {
            method: 'post',
            headers: authHeader(),
            json: {
              records: this.parseJSON(queryOptions.body),
            },
          });
          result = this.parseJSON(response.body);
          break;
        }

        case 'update_record': {
          response = await got(`${protocol}://${host}:${port}/${database}/${record_id}`, {
            method: 'put',
            headers: authHeader(),
            json: {
              _rev: revision_id,
              records: this.parseJSON(queryOptions.body),
            },
          });
          result = this.parseJSON(response.body);
          break;
        }

        case 'delete_record': {
          response = await got(`${protocol}://${host}:${port}/${database}/${record_id}`, {
            method: 'delete',
            headers: authHeader(),
            searchParams: {
              rev: revision_id,
            },
          });
          result = this.parseJSON(response.body);
          break;
        }

        case 'find': {
          response = await got(`${protocol}://${host}:${port}/${database}/_find`, {
            method: 'post',
            headers: authHeader(),
            json: this.parseJSON(queryOptions.body),
          });
          result = this.parseJSON(response.body);
          break;
        }

        case 'get_view': {
          response = await got(`${view_url}`, {
            method: 'get',
            headers: authHeader(),
            searchParams: {
              ...(limit?.length > 0 && { limit }),
              ...(skip?.length > 0 && { skip }),
              ...(descending && { descending }),
              ...(start_key?.length > 0 && { start_key }),
              ...(end_key?.length > 0 && { end_key }),
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

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { username, password, port, host, database, protocol } = sourceOptions;
    const combined = `${username}:${password}`;
    const key = Buffer.from(combined).toString('base64');
    const client = await got(`${protocol}://${host}:${port}/_all_dbs`, {
      method: 'get',
      headers: { Authorization: `Basic ${key}` },
    });
    if (!client) {
      throw new Error('Error');
    }

    return {
      status: 'ok',
    };
  }

  private parseJSON(json?: string): object {
    if (!json) return {};

    return JSON5.parse(json);
  }
}
