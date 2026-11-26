import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import 'openai/shims/node';
import OpenAI from 'openai';
import nodeFetch, { Headers, type RequestInfo, type RequestInit } from 'node-fetch';
import { validateHeaderName, validateHeaderValue } from 'http';
import { SourceOptions, QueryOptions, Operation } from './types';
import { getChatCompletion, generateEmbedding, listModels } from './query_operations';

export const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

function parseCustomHeaders(serialized?: string): Record<string, string> {
  const headers: Record<string, string> = Object.create(null);
  if (!serialized) return headers;

  let rows: unknown;
  try {
    rows = JSON.parse(serialized);
  } catch {
    // JSON parse errors can quote input containing credentials.
  }
  if (!Array.isArray(rows)) throw new QueryError('Invalid headers', 'Enter headers as name and value pairs.', {});

  for (const [index, row] of rows.entries()) {
    const invalid = () => new QueryError('Invalid headers', `Check the header name and value in row ${index + 1}.`, {});
    if (!Array.isArray(row) || row.length !== 2 || !row.every((part) => typeof part === 'string')) throw invalid();
    const name = row[0].trim().toLowerCase();
    const value = row[1];
    if (!name && !value) continue;
    try {
      validateHeaderName(name);
      validateHeaderValue(name, value);
    } catch {
      throw invalid();
    }
    if (['host', 'content-length', 'transfer-encoding', 'connection'].includes(name)) {
      throw new QueryError('Invalid headers', `The HTTP client manages the header in row ${index + 1}.`, {});
    }
    headers[name] = value;
  }
  return headers;
}

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
    const customHeaders = parseCustomHeaders(sourceOptions.customHeaders);
    const hasCustomHeaders = Object.keys(customHeaders).length > 0;
    if (!apiKey && !(baseUrl?.trim() && hasCustomHeaders)) {
      throw new QueryError('Missing credentials', 'Enter an API key or configure headers for a custom endpoint.', {});
    }

    // OpenRouter attributes usage to the app that sent it via these two headers, and shows the name
    // on its dashboards. They are optional, and harmless to any other OpenAI-compatible endpoint.
    const defaultHeaders: Record<string, string | null> = {};
    if (!apiKey) defaultHeaders.Authorization = null;
    if (siteUrl) defaultHeaders['HTTP-Referer'] = siteUrl;
    if (appName) defaultHeaders['X-Title'] = appName;

    return new OpenAI({
      apiKey: apiKey || '',
      baseURL: baseUrl?.trim() || DEFAULT_BASE_URL,
      ...(Object.keys(defaultHeaders).length ? { defaultHeaders } : {}),
      // Attach secrets after SDK debug logging. Redirects must not carry them to another endpoint.
      ...(hasCustomHeaders && {
        fetch: (url: RequestInfo, init?: RequestInit) => {
          const headers = new Headers(init?.headers);
          for (const [name, value] of Object.entries(customHeaders)) headers.set(name, value);
          // Use the SDK's Node transport so its agent and ToolJet's HTTP proxy still apply.
          return nodeFetch(url, { ...init, headers, redirect: 'manual' });
        },
      }),
    });
  }
}
