import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import { webSearch, newsSearch, redditPost, redditComments, buildRequestOptions, BASE_URL } from './query_operations';
import got from 'got';

export default class Serply implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    try {
      const operation = queryOptions.operation;

      switch (operation) {
        case 'search':
          return await webSearch(sourceOptions, queryOptions);
        case 'news':
          return await newsSearch(sourceOptions, queryOptions);
        case 'reddit_post':
          return await redditPost(sourceOptions, queryOptions);
        case 'reddit_comments':
          return await redditComments(sourceOptions, queryOptions);
      }
    } catch (error) {
      const errorMessage = error.message || 'An unknown error occurred';
      const errorDetails: any = {};

      if (error instanceof Error) {
        const serplyError = error as any;
        const { code, response, timings } = serplyError;

        errorDetails.code = code || null;
        errorDetails.timings = timings || null;
        errorDetails.status = response?.statusCode || null;

        if (response?.body) {
          try {
            errorDetails.body = JSON.parse(response.body);
          } catch (parseError) {
            errorDetails.body = response.body;
          }
        }
      }

      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      if (!sourceOptions.apiKey) {
        throw new Error('API key is required');
      }
      const requestOptions = buildRequestOptions(sourceOptions);

      await got(`${BASE_URL}/search/q=tooljet&num=10`, {
        ...requestOptions,
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
