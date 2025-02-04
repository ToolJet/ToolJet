import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import { Mistral as MistralClient } from '@mistralai/mistralai';

export default class MistralService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const client = await this.getConnection(sourceOptions);
    const { operation } = queryOptions;
    let result = {};

    try {
      switch (operation) {
        case 'text_generation': {
          const {
            model,
            messages,
            max_tokens,
            temperature,
            top_p,
            stop_tokens,
            random_seed,
            response_format,
            presence_penalty,
            frequency_penalty,
            completions,
            safe_prompt,
          } = queryOptions;

          const parsedMessages = typeof messages === 'string' ? JSON.parse(messages) : messages;

          const chatRequest = {
            model: model,
            messages: parsedMessages,
            ...(max_tokens && { max_tokens: parseInt(max_tokens) }),
            ...(temperature && { temperature: parseFloat(temperature) }),
            ...(top_p && { top_p: parseFloat(top_p) }),
            ...(stop_tokens && { stop: JSON.parse(stop_tokens) }),
            ...(random_seed && { random_seed: parseInt(random_seed) }),
            ...(response_format && { response_format: { type: response_format } }),
            ...(presence_penalty && { presence_penalty: parseFloat(presence_penalty) }),
            ...(frequency_penalty && { frequency_penalty: parseFloat(frequency_penalty) }),
            ...(completions && { n: parseInt(completions) }),
            ...(safe_prompt.value !== undefined && { safe_prompt: Boolean(safe_prompt.value) }),
          };

          const response = await client.chat.complete(chatRequest);
          result = {
            chat: response.choices[0].message.content,
          };
          break;
        }
      }
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      let mainError = null;

      if (error) {
        if (error.message.includes('Input validation failed')) {
          if (error.cause?.issues?.[0]?.message) {
            errorMessage = error.cause.issues[0].message;
          } else {
            errorMessage = 'Invalid input parameters';
          }
        } else {
          errorMessage = error.message;
        }
        mainError = error;
      }

      const errorDetails = {
        errorType: mainError?.name || 'Error',
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
      const chatResponse = await client.chat.complete({
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: 'What is the best French cheese?' }],
      });
      if (chatResponse.choices[0].message.content) {
        return {
          status: 'ok',
          message: 'Connection established successfully',
        };
      }
      return {
        status: 'failed',
        message: 'Could not get a valid response from Mistral API',
      };
    } catch (error) {
      return {
        status: 'failed',
        message: error.message || 'Could not connect to Mistral API',
      };
    }
  }

  async getConnection(sourceOptions: SourceOptions) {
    const { api_key } = sourceOptions;
    return new MistralClient({
      apiKey: api_key,
      timeoutMs: 15000,
    });
  }
}
