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

    const options: QueryOptions = {
      operation: Operation.TextGeneration,
      model: 'models/gemini-1.5-flash',
      system_prompt: 'Test system prompt',
      prompt: 'This is a test prompt to generate some text.',
      max_tokens: 100,
      temperature: 0.7,
    };

    const geminiClient = new GoogleGenerativeAI(apiKey);

    try {
      await generateText(geminiClient, options);
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

  async getConnection(sourceOptions: SourceOptions): Promise<GoogleGenerativeAI> {
    const { apiKey } = sourceOptions;

    if (!apiKey) {
      throw new QueryError('Connection could not be established', 'API key is missing', {});
    }

    return new GoogleGenerativeAI(apiKey);
  }
}