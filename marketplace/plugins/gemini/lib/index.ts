import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateText, chat } from './query_operations';

export default class GeminiService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation: Operation = queryOptions.operation;
    const geminiClient = await this.getConnection(sourceOptions);

    let result: object | object[];

    try {
      switch (operation) {
        case Operation.TextGeneration:
          result = { text: await generateText(geminiClient, queryOptions) };
          break;

        case Operation.Chat:
          result = { text: await chat(geminiClient, queryOptions) };
          break;

        default:
          throw new QueryError('Query could not be completed', 'Invalid operation', {});
      }
    } catch (error: any) {
      console.error('Error in Gemini query:', error);

      let errorMessage = 'Unknown error occurred';
      let errorDetails: any = {};

      if (error && typeof error === 'object') {
        try {
          errorMessage = error.message || error.response?.data?.error?.message || 'Unknown error';
          errorDetails = {
            requestId: error.response?.data?.requestId || error.code,
            errorType: error.response?.data?.error?.type || 'Unknown type',
            statusCode: error.response?.status || error.status,
          };
        } catch (parseError: any) {
          console.error('Failed to parse Gemini error response:', parseError);
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

    // Listing models validates the key without depending on any specific model,
    // so the test doesn't break when Google retires a model version
    let response: Response;
    try {
      response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', {
        headers: { 'x-goog-api-key': apiKey },
      });
    } catch (error: any) {
      throw new QueryError('Connection could not be established', error?.message || 'Unknown error occurred', {});
    }

    if (!response.ok) {
      const body: any = await response.json().catch(() => ({}));
      throw new QueryError('Connection could not be established', body?.error?.message || response.statusText || 'Unknown error occurred', {
        statusCode: response.status,
      });
    }

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: SourceOptions): Promise<GoogleGenerativeAI> {
    const { apiKey } = sourceOptions;

    if (!apiKey) {
      throw new QueryError('Connection could not be established', 'API key is missing', {});
    }

    return new GoogleGenerativeAI(apiKey);
  }
}
