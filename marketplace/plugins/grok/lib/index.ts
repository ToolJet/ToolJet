import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import OpenAI from 'openai';

/**
 * Sanitizes error messages to prevent leakage of credentials or sensitive headers,
 * and formats HTTP status codes into clear, user-friendly error messages.
 */
function sanitizeError(error: any, apiKey?: string): { message: string; details: Record<string, any> } {
  let rawMessage = error?.message || 'An unknown error occurred';

  // Redact API key if it appears in error message
  if (apiKey && apiKey.length > 5) {
    rawMessage = rawMessage.split(apiKey).join('[REDACTED]');
  }
  rawMessage = rawMessage.replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, 'Bearer [REDACTED]');

  const status = error?.status || error?.statusCode || null;
  let userFriendlyMessage = rawMessage;

  if (status === 400) {
    userFriendlyMessage = `Invalid request: ${rawMessage}`;
  } else if (status === 401) {
    userFriendlyMessage = 'Authentication failed: Invalid xAI API Key';
  } else if (status === 403) {
    userFriendlyMessage = 'Permission denied: Your xAI account or API key does not have access to this resource';
  } else if (status === 404) {
    userFriendlyMessage = `Resource or model not found: ${rawMessage}`;
  } else if (status === 429) {
    userFriendlyMessage = 'Rate limit exceeded: Too many requests sent to xAI Grok API';
  } else if (status && status >= 500 && status < 600) {
    userFriendlyMessage = `xAI server error (${status}): The Grok API encountered an internal issue. Please try again later.`;
  } else if (
    error?.name === 'APIConnectionError' ||
    error?.name === 'APIConnectionTimeoutError' ||
    error?.code === 'ENOTFOUND' ||
    error?.code === 'ETIMEDOUT' ||
    error?.code === 'ECONNREFUSED'
  ) {
    userFriendlyMessage =
      'Connection failed: Unable to reach the xAI Grok API. Please check your network connectivity.';
  }

  // Safe details without raw Axios/Fetch request or auth headers
  const safeDetails: Record<string, any> = {
    errorType: error?.name || 'Error',
    status: status,
    code: error?.code || null,
  };

  return {
    message: userFriendlyMessage,
    details: safeDetails,
  };
}

export default class GrokService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId?: string): Promise<QueryResult> {
    const client = await this.getConnection(sourceOptions);
    const { operation } = queryOptions;
    let result: any = {};

    try {
      switch (operation) {
        case 'chat': {
          const model = queryOptions.custom_model?.trim() || queryOptions.model?.trim() || 'grok-2-latest';

          let messages: any[] = [];

          if (queryOptions.messages) {
            messages =
              typeof queryOptions.messages === 'string' ? JSON.parse(queryOptions.messages) : queryOptions.messages;
          } else {
            if (queryOptions.system_prompt) {
              messages.push({ role: 'system', content: queryOptions.system_prompt });
            }
            if (queryOptions.prompt) {
              messages.push({ role: 'user', content: queryOptions.prompt });
            }
          }

          if (!Array.isArray(messages) || messages.length === 0) {
            throw new Error('Please provide either prompt or messages array');
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
          const model = queryOptions.custom_model?.trim() || queryOptions.model?.trim() || 'grok-2-vision-1212';

          if (!queryOptions.image_url?.trim()) {
            throw new Error('Image URL is required for vision chat');
          }

          if (!queryOptions.prompt?.trim()) {
            throw new Error('Prompt / question is required for vision chat');
          }

          const messages: any[] = [];

          if (queryOptions.system_prompt) {
            messages.push({ role: 'system', content: queryOptions.system_prompt });
          }

          messages.push({
            role: 'user',
            content: [
              { type: 'text', text: queryOptions.prompt },
              {
                type: 'image_url',
                image_url: {
                  url: queryOptions.image_url,
                  detail: queryOptions.detail || 'auto',
                },
              },
            ],
          });

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
          if (!queryOptions.prompt?.trim()) {
            throw new Error('Prompt is required for image generation');
          }

          const requestBody: any = {
            prompt: queryOptions.prompt,
            model: queryOptions.model?.trim() || 'grok-2-image',
            ...(queryOptions.n && { n: parseInt(String(queryOptions.n), 10) }),
            ...(queryOptions.response_format && {
              response_format: queryOptions.response_format as 'url' | 'b64_json',
            }),
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
          const modelId = queryOptions.model_id?.trim();
          if (!modelId) {
            throw new Error('Model ID is required');
          }
          const response = await client.models.retrieve(modelId);
          result = response;
          break;
        }

        default:
          throw new QueryError('Query could not be completed', 'Invalid operation', {});
      }
    } catch (error: any) {
      const sanitized = sanitizeError(error, sourceOptions?.apiKey);
      throw new QueryError('Query could not be completed', sanitized.message, sanitized.details);
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
      const sanitized = sanitizeError(error, sourceOptions?.apiKey);
      return {
        status: 'failed',
        message: sanitized.message,
      };
    }
  }

  async invokeMethod(methodName: string, context: object, sourceOptions: SourceOptions, args?: any): Promise<any> {
    if (methodName === 'listModels') {
      return await this.listModelsMethod(sourceOptions);
    }

    throw new QueryError('Method not found', `Method ${methodName} is not supported for Grok plugin`, {
      availableMethods: ['listModels'],
    });
  }

  private async listModelsMethod(sourceOptions: SourceOptions): Promise<any> {
    try {
      const client = await this.getConnection(sourceOptions);
      const response = await client.models.list();
      const rawModels = response?.data || (Array.isArray(response) ? response : []);
      const models = rawModels.map((m: any) => ({
        label: m.id,
        value: m.id,
      }));

      return {
        data: models,
      };
    } catch (error: any) {
      const sanitized = sanitizeError(error, sourceOptions?.apiKey);
      throw new QueryError('Failed to fetch models from xAI', sanitized.message, sanitized.details);
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<OpenAI> {
    const { apiKey } = sourceOptions;
    if (!apiKey || !apiKey.trim()) {
      throw new Error('API Key is required to connect to Grok');
    }

    return new OpenAI({
      apiKey: apiKey.trim(),
      baseURL: 'https://api.x.ai/v1',
      timeout: 60000,
    });
  }
}
