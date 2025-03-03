import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import { textGeneration, chat } from './query_operations';
import { CohereClientV2 } from 'cohere-ai';

export default class CohereService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const cohere = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (operation) {
        case Operation.TextGeneration:
          result = await textGeneration(cohere, queryOptions);
          break;
        case Operation.Chat:
          result = await chat(cohere, queryOptions);
          break;
        default:
          throw new QueryError('Query could not be completed', 'Invalid operation', {});
      }
    } catch (error: any) {
      console.error('Error in Cohere query:', error);
    
      let errorMessage = 'Unknown error occurred';
      let errorDetails: any = {};
    
      if (error && typeof error === 'object') {
        try {
          errorMessage = error?.body?.message || 'Unknown error';
          errorDetails = {
            requestId: error?.req?.id || 'N/A',
            errorType: error?.error?.type || error?.type|| error?.error?.details?.error || 'Unknown Type',
            statusCode: error?.statusCode || error?.res?.statusCode || 'Unknown status',
          };
        } catch (parseError: any) {
          console.error('Failed to parse error response:', parseError);
        }
      }
    
      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const { apiKey } = sourceOptions;
    if (!apiKey) {
      throw new QueryError('Connection could not be established', 'API key is missing', {});
    }
    const cohere = await this.getConnection(sourceOptions);

    try {
      await cohere.chat({
        model: 'command-r-plus-08-2024',
        messages: [
          {
            role: 'user',
            content: 'hello world!',
          },
        ],
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      throw new QueryError('Connection could not be established', errorMessage, {
        statusCode: error.response?.status || 500,
      });
    }
    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: SourceOptions): Promise<CohereClientV2> {
    const { apiKey } = sourceOptions;

    if (!apiKey) {
      throw new Error('API key missing: No API key provided in source options.');
    }
    
    const cohere = new CohereClientV2({token: apiKey});

    return cohere;
  }
}
