import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import OpenAI from 'openai';
import { SourceOptions, QueryOptions, Operation } from './types';
import { getChatCompletion, generateEmbedding, listModels } from './query_operations';

export const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * OpenRouter, and through it any OpenAI-compatible endpoint.
 *
 * One credential reaches hundreds of models across providers, where the provider-specific connectors
 * need a plugin and a key each. The API is OpenAI-compatible, so this uses the same SDK the OpenAI
 * connector does with the base URL pointed elsewhere, which is also why leaving that URL editable
 * costs nothing and makes the same connector serve Together, Groq, LiteLLM, vLLM or a self-hosted
 * gateway, including the air-gapped case where no third party may see the prompt at all.
 */
export default class OpenRouter implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, _dataSourceId: string): Promise<QueryResult> {
    const client = await this.getConnection(sourceOptions);
    const operation: Operation = queryOptions.operation;
    let result = {};

    try {
      switch (operation) {
        case Operation.Chat:
          result = await getChatCompletion(client, queryOptions);
          break;

        case Operation.GenerateEmbedding:
          result = await generateEmbedding(client, queryOptions);
          break;

        case Operation.ListModels:
          result = await listModels(client);
          break;

        default:
          throw new QueryError('Query could not be completed', 'Invalid operation', {});
      }
    } catch (error) {
      // OpenRouter reports the upstream provider's failure in `error.metadata`, which is the part
      // that says WHICH provider refused and why. Losing it leaves an unactionable "400 Bad Request".
      const details = {
        status: error?.status ?? null,
        code: error?.error?.code ?? error?.code ?? null,
        provider: error?.error?.metadata?.provider_name ?? null,
        upstream: error?.error?.metadata?.raw ?? null,
      };
      throw new QueryError('Query could not be completed', error?.message || 'An unknown error occurred', details);
    }

    return { status: 'ok', data: result };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions);
    try {
      const baseUrl = (sourceOptions.baseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, '');
      if (baseUrl === DEFAULT_BASE_URL) {
        // OpenRouter's model catalogue is public, so listing it does not validate the key.
        await client.get('/key');
      } else {
        const response = await client.models.list();
        if (!response?.data?.length) {
          throw new QueryError('Connection could not be established', 'The models list is empty', {});
        }
      }
      return { status: 'ok' };
    } catch (error) {
      throw new QueryError('Connection could not be established', error?.message, {});
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<OpenAI> {
    const { apiKey, baseUrl, siteUrl, appName } = sourceOptions;

    // OpenRouter attributes usage to the app that sent it via these two headers, and shows the name
    // on its dashboards. They are optional, and harmless to any other OpenAI-compatible endpoint.
    const defaultHeaders: Record<string, string> = {};
    if (siteUrl) defaultHeaders['HTTP-Referer'] = siteUrl;
    if (appName) defaultHeaders['X-Title'] = appName;

    return new OpenAI({
      apiKey,
      baseURL: baseUrl?.trim() || DEFAULT_BASE_URL,
      ...(Object.keys(defaultHeaders).length ? { defaultHeaders } : {}),
    });
  }
}
