import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import { Anthropic } from '@anthropic-ai/sdk'; 
import { getChatCompletion, /*getVisionCompletion */} from './query_operations';

export default class AnthropicService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation: Operation = queryOptions.operation;
    const anthropicClient: any = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (operation) {
        case Operation.Chat:
          result = await getChatCompletion(anthropicClient, queryOptions);
          break;

        /*case Operation.Vision:
          result = await getVisionCompletion(anthropicClient, queryOptions);
          break;*/

        default:
          throw new QueryError('Query could not be completed', 'Invalid operation', {});
      }
    } catch (error: any) {
      let errorMessage = 'Unknown error occured';
      let errorDetails: any = {};
      if (error) {
        try {
          errorMessage = error?.error?.error?.message || 'Unknown error';
          errorDetails = {requestId: error?.request_id,
            errorType: error?.error?.error?.type,
            statusCode: error?.status,}
        } catch (parseError) {
          console.error('Failed to parse Anthropic error response:', parseError);
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

    const anthropicClient = new Anthropic({ apiKey });

    try {
      await anthropicClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      });
      
    } catch (error: any) {
      let errorMessage = 'Unknown error occured';
      let errorDetails: any = {};
      if (error) {
        try {
          errorMessage = error?.error?.error?.message || 'Unknown error';
          errorDetails = {requestId: error?.request_id,
            errorType: error?.error?.error?.type,
            statusCode: error?.status,}
        } catch (parseError) {
          console.error('Failed to parse Anthropic error response:', parseError);
        }
      }
      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }
    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const { apiKey } = sourceOptions;

    if (!apiKey) {
      throw new QueryError('Connection could not be established', 'API key is missing', {});
    }

    const anthropicClient = new Anthropic({ apiKey });

    return anthropicClient;
  }
}