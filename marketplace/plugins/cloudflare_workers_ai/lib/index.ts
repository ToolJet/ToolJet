import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from '@tooljet-marketplace/common';

import { SourceOptions, QueryOptions, Operation } from './types';

const API_BASE = 'https://api.cloudflare.com/client/v4';

export default class Cloudflare_workers_ai implements QueryService {
  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
  ): Promise<QueryResult> {
    this.validateSourceOptions(sourceOptions);

    switch (queryOptions?.operation) {
      case Operation.RunModel:
        return this.runModel(sourceOptions, queryOptions);

      case Operation.TextGeneration:
        return this.textGeneration(sourceOptions, queryOptions);

      case Operation.TextEmbeddings:
        return this.textEmbeddings(sourceOptions, queryOptions);

      case Operation.TextToImage:
        return this.textToImage(sourceOptions, queryOptions);

      case Operation.SpeechRecognition:
        return this.speechRecognition(sourceOptions, queryOptions);

      case Operation.Translation:
        return this.translation(sourceOptions, queryOptions);

      case Operation.ListModels:
        return this.listModels(sourceOptions, queryOptions);

      default:
        throw new QueryError(
          'Query could not be completed',
          `Unsupported operation: ${queryOptions?.operation}`,
          {
            allowedOperations: Object.values(Operation),
          },
        );
    }
  }

  async testConnection(
    sourceOptions: SourceOptions,
  ): Promise<ConnectionTestResult> {
    this.validateSourceOptions(sourceOptions);

    const url =
      `${API_BASE}/accounts/${encodeURIComponent(sourceOptions.accountId)}` +
      '/ai/models/search?per_page=1';

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers(sourceOptions.apiToken),
      });

      const data = await this.parseResponse(response);

      if (!response.ok || data?.success === false) {
        throw this.cloudflareError(
          'Connection could not be established',
          response,
          data,
        );
      }

      return {
        status: 'ok',
        message: 'Cloudflare Workers AI connection successful',
      };
    } catch (error: any) {
      if (error instanceof QueryError) {
        throw error;
      }

      throw new QueryError(
        'Connection could not be established',
        error?.message || 'Unable to connect to Cloudflare Workers AI',
        {},
      );
    }
  }

  private async runModel(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
  ): Promise<QueryResult> {
    const model = this.requireModel(queryOptions.model);
    const input = this.parseJsonInput(queryOptions.input, 'JSON Input');

    return this.executeModel(sourceOptions, model, input);
  }

  private async textGeneration(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
  ): Promise<QueryResult> {
    const model = this.requireModel(queryOptions.model);
    const prompt = queryOptions.prompt?.trim();

    if (!prompt) {
      throw new QueryError(
        'Invalid configuration',
        'Prompt is required for text generation.',
        {},
      );
    }

    return this.executeModel(sourceOptions, model, { prompt });
  }

  private async textEmbeddings(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
  ): Promise<QueryResult> {
    const model = this.requireModel(queryOptions.model);

    let input: string | string[] = queryOptions.text || '';

    if (queryOptions.texts) {
      const parsed = this.parseJsonInput(queryOptions.texts, 'Texts');

      if (!Array.isArray(parsed)) {
        throw new QueryError(
          'Invalid configuration',
          'Texts must be a JSON array.',
          {},
        );
      }

      input = parsed;
    }

    if (
      (typeof input === 'string' && !input.trim()) ||
      (Array.isArray(input) && input.length === 0)
    ) {
      throw new QueryError(
        'Invalid configuration',
        'Text is required for embeddings.',
        {},
      );
    }

    return this.executeModel(sourceOptions, model, {
      text: input,
    });
  }

  private async textToImage(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
  ): Promise<QueryResult> {
    const model = this.requireModel(queryOptions.model);
    const prompt = queryOptions.prompt?.trim();

    if (!prompt) {
      throw new QueryError(
        'Invalid configuration',
        'Prompt is required for text-to-image.',
        {},
      );
    }

    let body: Record<string, any> = { prompt };

    if (queryOptions.imageOptions) {
      const options = this.parseJsonInput(
        queryOptions.imageOptions,
        'Image Options',
      );

      if (
        typeof options !== 'object' ||
        options === null ||
        Array.isArray(options)
      ) {
        throw new QueryError(
          'Invalid configuration',
          'Image Options must be a JSON object.',
          {},
        );
      }

      body = { ...body, ...options };
    }

    return this.executeModel(sourceOptions, model, body);
  }

  private async speechRecognition(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
  ): Promise<QueryResult> {
    const model = this.requireModel(queryOptions.model);

    if (!queryOptions.audio) {
      throw new QueryError(
        'Invalid configuration',
        'Base64 encoded audio is required for speech recognition.',
        {},
      );
    }

    const audio = Buffer.from(queryOptions.audio, 'base64');

    return this.executeModel(
      sourceOptions,
      model,
      audio,
      queryOptions.audioContentType || 'audio/mpeg',
    );
  }

  private async translation(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
  ): Promise<QueryResult> {
    const model = this.requireModel(queryOptions.model);
    const text = queryOptions.text?.trim();

    if (!text) {
      throw new QueryError(
        'Invalid configuration',
        'Text is required for translation.',
        {},
      );
    }

    const body: Record<string, string> = { text };

    if (queryOptions.language) {
      body.source_lang = queryOptions.language;
    }

    if (queryOptions.targetLanguage) {
      body.target_lang = queryOptions.targetLanguage;
    }

    return this.executeModel(sourceOptions, model, body);
  }

  private async listModels(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
  ): Promise<QueryResult> {
    const url = new URL(
      `${API_BASE}/accounts/${encodeURIComponent(sourceOptions.accountId)}` +
      '/ai/models/search',
    );

    this.setSearchParam(url, 'search', queryOptions.search);
    this.setSearchParam(url, 'task', queryOptions.task);
    this.setSearchParam(url, 'page', queryOptions.page);
    this.setSearchParam(url, 'per_page', queryOptions.perPage);

    if (queryOptions.hideExperimental !== undefined) {
      this.setSearchParam(
        url,
        'hide_experimental',
        queryOptions.hideExperimental,
      );
    }

    if (queryOptions.includeDeprecated !== undefined) {
      this.setSearchParam(
        url,
        'include_deprecated',
        queryOptions.includeDeprecated,
      );
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers(sourceOptions.apiToken),
    });

    const data = await this.parseResponse(response);

    if (!response.ok || data?.success === false) {
      throw this.cloudflareError(
        'Failed to fetch Cloudflare Workers AI models',
        response,
        data,
      );
    }

    return {
      status: 'ok',
      data,
    };
  }

  private async executeModel(
    sourceOptions: SourceOptions,
    model: string,
    body: any,
    contentType = 'application/json',
  ): Promise<QueryResult> {
    const encodedModel = model
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');

    const url =
      `${API_BASE}/accounts/${encodeURIComponent(sourceOptions.accountId)}` +
      `/ai/run/${encodedModel}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...this.headers(sourceOptions.apiToken),
        'Content-Type': contentType,
      },
      body:
        body instanceof Buffer
          ? body
          : JSON.stringify(body),
    });

    const responseContentType =
      response.headers.get('content-type') || '';

    if (!response.ok) {
      const errorData =
        responseContentType.includes('application/json')
          ? await this.parseResponse(response)
          : await response.text();

      throw this.cloudflareError(
        'Cloudflare Workers AI model execution failed',
        response,
        errorData,
      );
    }

    if (
      responseContentType.includes('application/json') ||
      responseContentType.includes('+json')
    ) {
      const data = await response.json();

      if (data?.success === false) {
        throw this.cloudflareError(
          'Cloudflare Workers AI model execution failed',
          response,
          data,
        );
      }

      return {
        status: 'ok',
        data,
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return {
      status: 'ok',
      data: {
        base64: buffer.toString('base64'),
        contentType:
          responseContentType || 'application/octet-stream',
        size: buffer.length,
      },
    };
  }

  private headers(apiToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${apiToken}`,
      Accept: 'application/json',
    };
  }

  private validateSourceOptions(
    sourceOptions: SourceOptions,
  ): void {
    if (!sourceOptions?.apiToken) {
      throw new QueryError(
        'Invalid configuration',
        'Cloudflare API Token is required.',
        {
          code: 'MISSING_API_TOKEN',
        },
      );
    }

    if (!sourceOptions?.accountId) {
      throw new QueryError(
        'Invalid configuration',
        'Cloudflare Account ID is required.',
        {
          code: 'MISSING_ACCOUNT_ID',
        },
      );
    }
  }

  private requireModel(model?: string): string {
    if (!model?.trim()) {
      throw new QueryError(
        'Invalid configuration',
        'Model ID is required.',
        {
          code: 'MISSING_MODEL',
        },
      );
    }

    return model.trim();
  }

  private parseJsonInput(
    value: string | undefined,
    fieldName: string,
  ): any {
    if (!value?.trim()) {
      throw new QueryError(
        'Invalid configuration',
        `${fieldName} is required.`,
        {},
      );
    }

    try {
      return JSON.parse(value);
    } catch {
      throw new QueryError(
        'Invalid configuration',
        `${fieldName} must contain valid JSON.`,
        {
          field: fieldName,
        },
      );
    }
  }

  private setSearchParam(
    url: URL,
    key: string,
    value: string | number | boolean | undefined,
  ): void {
    if (value !== undefined && value !== null && String(value)) {
      url.searchParams.set(key, String(value));
    }
  }

  private async parseResponse(response: Response): Promise<any> {
    const contentType =
      response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  private cloudflareError(
    title: string,
    response: Response,
    data: any,
  ): QueryError {
    const errors = Array.isArray(data?.errors)
      ? data.errors
      : [];

    const messages = Array.isArray(data?.messages)
      ? data.messages
      : [];

    const message =
      errors
        .map((error: any) => error?.message)
        .filter(Boolean)
        .join('; ') ||
      messages.filter(Boolean).join('; ') ||
      (typeof data === 'string' ? data : null) ||
      `Cloudflare returned HTTP ${response.status}.`;

    return new QueryError(title, message, {
      status: response.status,
      statusText: response.statusText,
      success: data?.success,
      errors,
      messages,
    });
  }
}
