import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import OpenAI from 'openai';

export default class GrokService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId?: string): Promise<QueryResult> {
    const client = await this.getConnection(sourceOptions);
    const { operation } = queryOptions;
    let result: any = {};

    try {
      switch (operation) {
        case 'chat': {
          const model = queryOptions.custom_model || queryOptions.model || 'grok-2-latest';
          let messages: any[] = [];

          if (queryOptions.messages) {
            messages =
              typeof queryOptions.messages === 'string'
                ? JSON.parse(queryOptions.messages)
                : queryOptions.messages;
          } else {
            if (queryOptions.system_prompt) {
              messages.push({ role: 'system', content: queryOptions.system_prompt });
            }
            if (queryOptions.prompt) {
              messages.push({ role: 'user', content: queryOptions.prompt });
            }
          }

          if (messages.length === 0) {
            throw new Error('Please provide either prompt or messages');
          }

          const requestBody: any = {
            model,
            messages,
            ...(queryOptions.temperature !== undefined &&
              queryOptions.temperature !== '' && {
                temperature: parseFloat(String(queryOptions.temperature)),
              }),
            ...(queryOptions.max_tokens !== undefined &&
              queryOptions.max_tokens !== '' && {
                max_tokens: parseInt(String(queryOptions.max_tokens), 10),
              }),
            ...(queryOptions.top_p !== undefined &&
              queryOptions.top_p !== '' && {
                top_p: parseFloat(String(queryOptions.top_p)),
              }),
          };

          const response = await client.chat.completions.create(requestBody);
          result = response;
          break;
        }

        case 'chat_vision': {
          const model = queryOptions.model || 'grok-2-vision-1212';
          const messages: any[] = [];

          if (queryOptions.system_prompt) {
            messages.push({ role: 'system', content: queryOptions.system_prompt });
          }

          const content: any[] = [];
          if (queryOptions.prompt) {
            content.push({ type: 'text', text: queryOptions.prompt });
          }
          if (queryOptions.image_url) {
            content.push({
              type: 'image_url',
              image_url: {
                url: queryOptions.image_url,
                detail: queryOptions.detail || 'auto',
              },
            });
          }

          messages.push({ role: 'user', content });

          const requestBody: any = {
            model,
            messages,
            ...(queryOptions.temperature !== undefined &&
              queryOptions.temperature !== '' && {
                temperature: parseFloat(String(queryOptions.temperature)),
              }),
            ...(queryOptions.max_tokens !== undefined &&
              queryOptions.max_tokens !== '' && {
                max_tokens: parseInt(String(queryOptions.max_tokens), 10),
              }),
          };

          const response = await client.chat.completions.create(requestBody);
          result = response;
          break;
        }

        case 'image_generation': {
          const requestBody: any = {
            prompt: queryOptions.prompt,
            model: queryOptions.model || 'grok-2-image',
            ...(queryOptions.n && { n: parseInt(String(queryOptions.n), 10) }),
            ...(queryOptions.response_format && { response_format: queryOptions.response_format }),
          };

          const response = await client.images.generate(requestBody);
          result = response;
          break;
        }

        case 'list_models': {
          const response = await client.models.list();
          result = response.data || response;
          break;
        }

        case 'get_model': {
          if (!queryOptions.model_id) {
            throw new Error('Model ID is required');
          }
          const response = await client.models.retrieve(queryOptions.model_id);
          result = response;
          break;
        }

        default:
          throw new QueryError('Query could not be completed', 'Invalid operation', {});
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'An unknown error occurred';
      const errorDetails = {
        errorType: error?.name || 'Error',
        status: error?.status || null,
        code: error?.code || null,
        raw: error,
      };
      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      const client = await this.getConnection(sourceOptions);
      const models = await client.models.list();
      if (models && (models.data || Array.isArray(models))) {
        return {
          status: 'ok',
          message: 'Connection established successfully',
        };
      }
      return {
        status: 'failed',
        message: 'Could not retrieve models from xAI Grok API',
      };
    } catch (error: any) {
      return {
        status: 'failed',
        message: error?.message || 'Could not connect to xAI Grok API',
      };
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<OpenAI> {
    const { apiKey } = sourceOptions;
    if (!apiKey) {
      throw new Error('API Key is required to connect to Grok');
    }

    return new OpenAI({
      apiKey,
      baseURL: 'https://api.x.ai/v1',
      timeout: 60000,
    });
  }
}
