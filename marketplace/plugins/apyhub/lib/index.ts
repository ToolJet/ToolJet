import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import { getSummarizedContent, getTranslatedContent, getValidatedEmail,getParsedResume } from './query_operations';

export default class Apyhub implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {

    const operation: Operation = queryOptions.operation;
    let result = {};
    try {
      switch (operation) {
        case Operation.ValidateEmail:
          result = await getValidatedEmail(queryOptions, sourceOptions);
          console.log(result);
          break;
        case Operation.SummarizeText:
          result = await getSummarizedContent(queryOptions, sourceOptions);
          console.log(result);
          break;
        case Operation.TranslateText:
          result = await getTranslatedContent(queryOptions, sourceOptions);
          break;
        case Operation.ParseResume:
          result = await getParsedResume(queryOptions, sourceOptions);
          break;
        default:
          throw new QueryError('Query could not be completed', 'Invalid operation', {});
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async getConnection(sourceOptions: SourceOptions, _options?: object): Promise<any> {
    const baseURL = 'https://api.apyhub.com';
    const apiToken = sourceOptions.apiKey;
    
    return {
      baseURL,
      apiToken
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const connection = await this.getConnection(sourceOptions);

    try {
      const response = await fetch(`${connection.baseURL}/data/info/country?country=in`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apy-token': connection.apiToken
        }
      });

      if (response.status !== 200) {
        throw new QueryError('Connection test failed', 'API returned non-200 status', {});
      }

      return {
        status: 'ok',
      };
    } catch (error) {
      throw new QueryError('Connection test failed', error.message, {});
    }
  }

}
