import { ConnectionTestResult, QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import got, { Headers } from 'got';
const JSON5 = require('json5');
export default class influxdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    let result = {};
    let response = null;
    const apiKey = sourceOptions.api_token;
    const { port, host, protocol } = sourceOptions;
    const { operation, bucket_id, bucket, org, precision, name } = queryOptions;

    const authHeader = (token: string): Headers => {
      return {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      };
    };

    try {
      switch (operation) {
        case 'list_buckets': {
          response = await got(`${protocol}://${host}:${port}/api/v2/buckets`, {
            method: 'get',
            headers: authHeader(apiKey),
          });

          result = this.parseJSON(response.body);
          break;
        }
        case 'retrieve_bucket': {
          response = await got(`${protocol}://${host}:${port}/api/v2/buckets/${bucket_id}`, {
            headers: authHeader(apiKey),
            method: 'get',
          });
          result = this.parseJSON(response.body);
          break;
        }

        case 'create_bucket': {
          response = await got(`${protocol}://${host}:${port}/api/v2/buckets`, {
            method: 'post',
            headers: authHeader(apiKey),
            json: this.parseJSON(queryOptions.body),
          });
          result = this.parseJSON(response.body);
          break;
        }

        case 'update_bucket': {
          response = await got(`${protocol}://${host}:${port}/api/v2/buckets/${bucket_id}`, {
            method: 'patch',
            headers: authHeader(apiKey),
            json: this.parseJSON(queryOptions.body),
          });
          result = this.parseJSON(response.body);
          break;
        }

        case 'delete_bucket': {
          response = await got(`${protocol}://${host}:${port}/api/v2/buckets/${bucket_id}`, {
            method: 'delete',
            headers: authHeader(apiKey),
          });
          result = this.parseJSON(response.body);
          break;
        }

        case 'query_suggestions_for_branching': {
          response = await got(`${protocol}://${host}:${port}/api/v2/query/suggestions/${name}`, {
            headers: authHeader(apiKey),
            method: 'get',
          });
          result = this.parseJSON(response.body);
          break;
        }

        case 'query_suggestions': {
          response = await got(`${protocol}://${host}:${port}/api/v2/query/suggestions`, {
            headers: authHeader(apiKey),
            method: 'get',
          });
          result = this.parseJSON(response.body);
          break;
        }

        case 'analyze_flux_query': {
          response = await got(`${protocol}://${host}:${port}/api/v2/query/analyze`, {
            method: 'post',
            headers: authHeader(apiKey),
            json: this.parseJSON(queryOptions.body),
          });
          result = this.parseJSON(response.body);
          break;
        }
        case 'query_data': {
          response = await got(`${protocol}://${host}:${port}/api/v2/query`, {
            method: 'post',
            headers: {
              Authorization: `Token ${apiKey}`,
              'Content-Type': 'application/vnd.flux',
            },
            searchParams: {
              ...(org?.length > 0 && { org }),
            },
            body: queryOptions.body,
          });
          result = response.body;
          break;
        }

        case 'abstract_syntax_tree': {
          response = await got(`${protocol}://${host}:${port}/api/v2/query/ast`, {
            method: 'post',
            headers: authHeader(apiKey),
            json: this.parseJSON(queryOptions.body),
          });
          result = this.parseJSON(response.body);
          break;
        }
        case 'write': {
          response = await got(`${protocol}://${host}:${port}/api/v2/write`, {
            method: 'post',
            headers: {
              Authorization: `Token ${apiKey}`,
              'Content-Type': 'text/plain',
            },
            searchParams: {
              ...(bucket?.length > 0 && { bucket }),
              ...(org?.length > 0 && { org }),
              ...(precision && { precision }),
            },
            body: queryOptions.body,
          });
          result = response.body;
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
    const { port, host, protocol, api_token } = sourceOptions;
    const client = await got(`${protocol}://${host}:${port}/influxdb/cloud/api//ping`, {
      method: 'get',
      headers: { Authorization: `Token ${api_token}` },
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
