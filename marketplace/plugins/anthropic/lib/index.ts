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
        case Operation.ChatV2:
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

    // Listing models validates the key without depending on any specific model.
    // The installed SDK version has no models endpoint, so call the REST API directly.
    let response: Response;
    try {
      response = await fetch('https://api.anthropic.com/v1/models?limit=1', {
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      });
    } catch (error: any) {
      throw new QueryError('Connection could not be established', error?.message || 'Unknown error occurred', {});
    }

    if (!response.ok) {
      const body: any = await response.json().catch(() => ({}));
      throw new QueryError(
        'Connection could not be established',
        body?.error?.message || response.statusText || 'Unknown error occurred',
        { errorType: body?.error?.type, statusCode: response.status }
      );
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