import axios, { AxiosInstance } from 'axios';
import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';

const BASE_URL = 'https://api.cloudflare.com/client/v4';

const getErrorMessage = (error: any): string => {
  const cloudflareErrors = error?.response?.data?.errors;
  if (Array.isArray(cloudflareErrors) && cloudflareErrors.length > 0) {
    return cloudflareErrors.map((e: any) => e.message).join('; ');
  }
  return error?.message || 'Unknown error';
};

class CloudflareD1Client {
  private client: AxiosInstance;
  private accountId: string;

  constructor(sourceOptions: SourceOptions) {
    this.accountId = encodeURIComponent(sourceOptions.account_id);
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${sourceOptions.api_token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async listDatabases() {
    const { data } = await this.client.get(`/accounts/${this.accountId}/d1/database`);
    return data;
  }
}

export default class Cloudflare_d1 implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const client = new CloudflareD1Client(sourceOptions);
    let result: any;

    try {
      switch (queryOptions.operation) {
        case 'list_databases':
          result = (await client.listDatabases()).result;
          break;

        default:
          throw new Error(`Unsupported operation: ${queryOptions.operation}`);
      }
    } catch (error: any) {
      throw new QueryError('Query could not be completed', getErrorMessage(error), {});
    }

    return {
      status: 'ok',
      data: result ?? {},
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      const client = new CloudflareD1Client(sourceOptions);
      await client.listDatabases();
      return { status: 'ok' };
    } catch (error: any) {
      return {
        status: 'failed',
        message: getErrorMessage(error),
      };
    }
  }
}
