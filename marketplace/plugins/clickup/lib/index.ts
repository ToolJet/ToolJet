import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import axios, { AxiosInstance } from 'axios';

export default class Clickup implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    return {
      status: 'ok',
      data: {},
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions);

    try {
      const response = await client.get('/v2/team');

      // Check if at least one team (workspace) is returned
      if (response.data?.teams?.length > 0) {
        return {
          status: 'ok',
        };
      } else {
        throw new QueryError('No teams found', 'The team list is empty', {});
      }
    } catch (error) {
      throw new QueryError(
        'Connection could not be established',
        error?.response?.data?.err || error?.message,
        {}
      );
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<AxiosInstance> {
    const { apiKey } = sourceOptions;

    const client = axios.create({
      baseURL: 'https://api.clickup.com/api',
      headers: {
        Authorization: apiKey,
      }
    });

    return client;
  }
}
