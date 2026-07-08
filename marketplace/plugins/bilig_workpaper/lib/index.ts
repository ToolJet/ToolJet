import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from '@tooljet-marketplace/common';
import {
  FormulaReadbackPayload,
  Operation,
  QueryOptions,
  SourceOptions,
} from './types';

const DEFAULT_FORMULA_READBACK_PATH = '/api/workpaper/n8n/forecast';

export default class BiligWorkpaper implements QueryService {
  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<QueryResult> {
    let result = {};

    try {
      switch (queryOptions.operation) {
        case Operation.VerifyFormulaReadback:
          result = await this.verifyFormulaReadback(
            sourceOptions,
            queryOptions
          );
          break;
        default:
          throw new QueryError(
            'Unsupported Operation',
            `${queryOptions.operation} is not supported.`,
            {}
          );
      }
    } catch (error) {
      if (error instanceof QueryError) {
        throw error;
      }

      throw new QueryError(
        'Query could not be completed',
        this.errorMessage(error),
        {}
      );
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(
    sourceOptions: SourceOptions
  ): Promise<ConnectionTestResult> {
    try {
      const response = await fetch(this.buildEndpoint(sourceOptions), {
        method: 'OPTIONS',
      });

      if (!response.ok) {
        throw new QueryError(
          'Connection could not be established',
          `HTTP ${response.status} ${response.statusText}`,
          await this.parseResponse(response)
        );
      }

      return { status: 'ok' };
    } catch (error) {
      if (error instanceof QueryError) {
        throw error;
      }

      throw new QueryError(
        'Connection could not be established',
        this.errorMessage(error),
        {}
      );
    }
  }

  private async verifyFormulaReadback(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<unknown> {
    return this.postFormulaReadback(sourceOptions, {
      sheetName: queryOptions.sheetName || 'Inputs',
      address: queryOptions.address || 'B3',
      value: this.parseValue(queryOptions.value),
    });
  }

  private async postFormulaReadback(
    sourceOptions: SourceOptions,
    payload: FormulaReadbackPayload
  ): Promise<Record<string, unknown>> {
    const response = await fetch(this.buildEndpoint(sourceOptions), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await this.parseResponse(response);

    if (!response.ok) {
      throw new QueryError(
        'Bilig WorkPaper request failed',
        `HTTP ${response.status} ${response.statusText}`,
        data
      );
    }

    return data;
  }

  private buildEndpoint(sourceOptions: SourceOptions): string {
    const baseUrl = String(sourceOptions.baseUrl || '').trim();

    if (!baseUrl) {
      throw new QueryError(
        'Bilig WorkPaper URL missing',
        'Enter a Bilig WorkPaper formula server base URL.',
        {}
      );
    }

    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const normalizedPath = String(
      sourceOptions.formulaReadbackPath || DEFAULT_FORMULA_READBACK_PATH
    ).replace(/^\/+/, '');

    return new URL(normalizedPath, normalizedBase).toString();
  }

  private async parseResponse(
    response: Response
  ): Promise<Record<string, unknown>> {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      const data = JSON.parse(text);

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return data;
      }

      return { body: data };
    } catch (_error) {
      return { body: text };
    }
  }

  private parseValue(value: QueryOptions['value']): unknown {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return '';
    }

    try {
      return JSON.parse(trimmed);
    } catch (_error) {
      return value;
    }
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'An unknown error occurred';
  }
}
