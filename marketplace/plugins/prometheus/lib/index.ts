import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import { instantQuery, rangeQuery, buildRequestOptions } from './query_operations';
import got from 'got';

export default class Prometheus implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    try {
      const operation = queryOptions.operation;

      switch (operation) {
        case 'instant_query':
          return await instantQuery(sourceOptions, queryOptions);
        case 'range_query':
          return await rangeQuery(sourceOptions, queryOptions);
      }
    } catch (error) {
      let prometheusErrorData = null;

      if (error.response && error.response.body) {
        try {
          prometheusErrorData = JSON.parse(error.response.body);
        } catch (parseError) {
          const errorMessage = error.message || 'An unknown error occurred';
          const errorDetails: any = {};

          if (error instanceof Error) {
            const prometheusError = error as any;
            const { code, response, timings } = prometheusError;

            errorDetails.code = code || null;
            errorDetails.timings = timings || null;
            errorDetails.status = response?.statusCode || null;
          }

          throw new QueryError('Query could not be completed', errorMessage, errorDetails);
        }
      }

      const errorDetails = {
        httpStatus: error.response.statusCode || null,
        prometheusStatus: prometheusErrorData.status || null,
        prometheusErrorType: prometheusErrorData.errorType || null,
        prometheusError: prometheusErrorData.error || null,
        warnings: prometheusErrorData.warnings || null,
        infos: prometheusErrorData.infos || null,
      };

      throw new QueryError('Query could not be completed', error.message, errorDetails);
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      if (!sourceOptions.server_url) {
        throw new Error('Server URL is required');
      }
      const requestOptions = buildRequestOptions(sourceOptions, 'GET');

      await got(`${sourceOptions.server_url}/api/v1/query`, {
        ...requestOptions,
        searchParams: {
          query: 'up',
        },
        timeout: 5000,
      });

      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'failed',
        message: error.message,
      };
    }
  }
}
