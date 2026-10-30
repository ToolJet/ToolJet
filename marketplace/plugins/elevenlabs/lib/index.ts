import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import got, { Headers, OptionsOfBufferResponseBody, Response } from 'got';
import FormData from 'form-data';
import { SourceOptions, QueryOptions, SchemaObject, FileObject, BinaryResult, Region } from './types';

// Fixed per region rather than user-entered, so no URL from the connection form is ever requested.
const BASE_URLS: Record<Region, string> = {
  default: 'https://api.elevenlabs.io',
  us: 'https://api.us.elevenlabs.io',
  eu: 'https://api.eu.residency.elevenlabs.io',
  in: 'https://api.in.residency.elevenlabs.io',
};

// Response headers worth surfacing next to generated audio (e.g. the history item it was saved as).
const BINARY_RESULT_HEADERS = ['history-item-id', 'request-id', 'character-cost'];

const DATA_URL_PATTERN = /^data:([^;,]+)?(?:;[^,]*)?;base64,([\s\S]*)$/;

export default class Elevenlabs implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const { operation, path } = queryOptions;
    if (!operation || !path) {
      throw new QueryError('Query could not be completed', 'Select an operation before running the query.', {});
    }

    const params = queryOptions.params ?? {};
    const requestOptions: OptionsOfBufferResponseBody = {
      method: operation.toUpperCase() as OptionsOfBufferResponseBody['method'],
      headers: this.authHeaders(sourceOptions),
      responseType: 'buffer',
      searchParams: this.searchParams(params.query ?? {}),
    };

    if (!['get', 'delete'].includes(operation.toLowerCase())) {
      this.setRequestBody(requestOptions, queryOptions, params.request ?? {});
    }

    const url = `${this.baseUrl(sourceOptions)}${this.resolvePath(path, params.path ?? {})}`;

    let response: Response<Buffer>;
    try {
      response = await got(url, requestOptions);
    } catch (error) {
      throw this.toQueryError(error);
    }

    return { status: 'ok', data: this.parseResponse(response) };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    if (!sourceOptions.api_key) {
      return { status: 'failed', message: 'API key is required' };
    }

    try {
      await got(`${this.baseUrl(sourceOptions)}/v1/models`, {
        method: 'GET',
        headers: this.authHeaders(sourceOptions),
        responseType: 'buffer',
      });
      return { status: 'ok' };
    } catch (error) {
      const queryError = this.toQueryError(error);
      return { status: 'failed', message: queryError.description };
    }
  }

  private baseUrl(sourceOptions: SourceOptions): string {
    return BASE_URLS[sourceOptions.region] ?? BASE_URLS.default;
  }

  private authHeaders(sourceOptions: SourceOptions): Headers {
    return { 'xi-api-key': sourceOptions.api_key };
  }

  private resolvePath(path: string, pathParams: Record<string, unknown>): string {
    return path.replace(/{([^}]+)}/g, (_, name: string) => {
      const value = pathParams[name];
      if (value === undefined || value === null || value === '') {
        throw new QueryError('Query could not be completed', `Path parameter "${name}" is required.`, {
          parameter: name,
        });
      }
      return encodeURIComponent(String(value));
    });
  }

  /** Arrays are repeated (`?ids=a&ids=b`), which is how the API reads list query params. */
  private searchParams(queryParams: Record<string, unknown>): URLSearchParams {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value === undefined || value === null || value === '') continue;
      const values = Array.isArray(value) ? value : [value];
      values.forEach((entry) =>
        searchParams.append(key, typeof entry === 'object' ? JSON.stringify(entry) : String(entry))
      );
    }
    return searchParams;
  }

  // ---- request body ---------------------------------------------------------

  /**
   * The spec says per operation whether the body is JSON or multipart (file uploads such as
   * speech to text, voice changer and audio isolation), and the endpoint picker saves that part
   * of the spec with the query.
   */
  private setRequestBody(
    requestOptions: OptionsOfBufferResponseBody,
    queryOptions: QueryOptions,
    bodyParams: Record<string, unknown>
  ): void {
    if (Object.keys(bodyParams).length === 0) return;

    const content = queryOptions.selectedOperation?.requestBody?.content ?? {};
    const properties = this.schemaProperties(
      content['multipart/form-data']?.schema ?? content['application/json']?.schema
    );

    if (content['multipart/form-data'] && !content['application/json']) {
      const form = this.buildForm(bodyParams, properties);
      requestOptions.body = form;
      requestOptions.headers = { ...requestOptions.headers, ...form.getHeaders() };
      return;
    }

    // Schema-less bodies come out of the endpoint picker as a single `body` field.
    const keys = Object.keys(bodyParams);
    if (keys.length === 1 && keys[0] === 'body' && !properties.body) {
      requestOptions.json = this.parseJsonString(bodyParams.body, 'body');
      return;
    }

    requestOptions.json = Object.fromEntries(
      Object.entries(bodyParams).map(([key, value]) => [key, this.coerceValue(key, value, properties[key])])
    );
  }

  private buildForm(bodyParams: Record<string, unknown>, properties: Record<string, SchemaObject>): FormData {
    const form = new FormData();
    for (const [key, value] of Object.entries(bodyParams)) {
      if (value === undefined || value === null || value === '') continue;
      const schema = properties[key];
      const isFileField = this.isBinarySchema(schema) || this.isBinarySchema(schema?.items);
      const values =
        Array.isArray(value) && (schema?.type === 'array' || value.some((v) => this.toFile(v, false)))
          ? value
          : [value];

      for (const entry of values) {
        const file = this.toFile(entry, isFileField);
        if (file) {
          const buffer = Buffer.from(file.base64Data, 'base64');
          form.append(key, buffer, {
            filename: file.name || key,
            contentType: file.type || 'application/octet-stream',
            knownLength: buffer.length,
          });
        } else if (isFileField) {
          throw new QueryError(
            'Query could not be completed',
            `"${key}" must be a file: pass a File Picker file (e.g. {{components.filepicker1.files[0]}}), an Audio Recorder data URL, or a base64 string.`,
            { parameter: key }
          );
        } else {
          form.append(key, typeof entry === 'object' ? JSON.stringify(entry) : String(entry));
        }
      }
    }
    return form;
  }

  /**
   * Accepts the shapes ToolJet components expose a file as: a File Picker file object, a
   * `data:<mime>;base64,` URL (Audio Recorder, Camera), or plain base64 when the field is known to be binary.
   */
  private toFile(value: unknown, isFileField: boolean): FileObject | null {
    if (value && typeof value === 'object' && typeof (value as FileObject).base64Data === 'string') {
      const file = value as FileObject;
      const fromDataUrl = this.toFile(file.base64Data, true);
      return { ...fromDataUrl, name: file.name, type: file.type || fromDataUrl?.type };
    }
    if (typeof value !== 'string') return null;

    const match = DATA_URL_PATTERN.exec(value.trim());
    if (match) {
      const type = match[1] || 'application/octet-stream';
      return { base64Data: match[2], type, name: `file.${this.extensionFor(type)}` };
    }
    return isFileField ? { base64Data: value.trim() } : null;
  }

  private extensionFor(mimeType: string): string {
    const subtype = mimeType.split('/')[1]?.split(/[;+]/)[0] ?? 'bin';
    return subtype === 'mpeg' ? 'mp3' : subtype;
  }

  private isBinarySchema(schema?: SchemaObject): boolean {
    if (!schema) return false;
    if (schema.format === 'binary' || schema.contentMediaType === 'application/octet-stream') return true;
    return [schema.anyOf, schema.oneOf].some((options) => options?.some((option) => this.isBinarySchema(option)));
  }

  private schemaProperties(schema?: SchemaObject): Record<string, SchemaObject> {
    if (!schema) return {};
    if (schema.properties) return schema.properties;
    return [...(schema.allOf ?? []), ...(schema.oneOf ?? []), ...(schema.anyOf ?? [])].reduce(
      (acc: Record<string, SchemaObject>, subSchema) => ({ ...acc, ...this.schemaProperties(subSchema) }),
      {}
    );
  }

  /**
   * Every field in the endpoint picker is a text input, so structured values such as
   * `voice_settings` arrive as JSON strings unless written as `{{ }}` expressions.
   */
  private coerceValue(key: string, value: unknown, schema?: SchemaObject): unknown {
    if (typeof value !== 'string' || !schema) return value;
    const trimmed = value.trim();

    switch (schema.type) {
      case 'object':
      case 'array':
        return this.parseJsonString(trimmed, key);
      case 'integer':
      case 'number':
        return trimmed !== '' && !isNaN(Number(trimmed)) ? Number(trimmed) : value;
      case 'boolean':
        return trimmed === 'true' ? true : trimmed === 'false' ? false : value;
      default:
        return value;
    }
  }

  private parseJsonString(value: unknown, key: string): unknown {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      throw new QueryError('Query could not be completed', `"${key}" must be valid JSON.`, { parameter: key });
    }
  }

  // ---- response -------------------------------------------------------------

  private parseResponse(response: Response<Buffer>): object | object[] {
    const body = response.body ?? Buffer.alloc(0);
    const mimeType = (response.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();

    if (body.length === 0) return {};
    if (mimeType === 'application/json' || mimeType.endsWith('+json')) {
      return JSON.parse(body.toString('utf8'));
    }
    if (mimeType.startsWith('text/') || mimeType === 'application/x-ndjson') {
      const text = body.toString('utf8');
      try {
        return JSON.parse(text);
      } catch {
        return { text };
      }
    }
    return this.toBinaryResult(response, body, mimeType || 'application/octet-stream');
  }

  private toBinaryResult(response: Response<Buffer>, body: Buffer, mimeType: string): BinaryResult {
    const base64 = body.toString('base64');
    const result: BinaryResult = {
      mimeType,
      base64,
      dataUrl: `data:${mimeType};base64,${base64}`,
      size: body.length,
    };

    const fileName = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(response.headers['content-disposition'] ?? '')?.[1];
    if (fileName) result.fileName = decodeURIComponent(fileName);

    const headers = Object.fromEntries(
      BINARY_RESULT_HEADERS.filter((name) => response.headers[name] !== undefined).map((name) => [
        name,
        String(response.headers[name]),
      ])
    );
    if (Object.keys(headers).length > 0) result.headers = headers;

    return result;
  }

  // ---- errors ---------------------------------------------------------------

  private toQueryError(error: unknown): QueryError {
    if (error instanceof QueryError) return error;

    const response = (error as { response?: Response<Buffer> })?.response;
    if (!response) {
      const message = error instanceof Error ? error.message : String(error);
      return new QueryError('Query could not be completed', message, {});
    }

    const raw = Buffer.isBuffer(response.body) ? response.body.toString('utf8') : String(response.body ?? '');
    let body: unknown = raw;
    try {
      body = JSON.parse(raw);
    } catch {
      // not JSON; keep the raw text
    }

    const message = this.errorMessage(body) || response.statusMessage || 'Request failed';
    return new QueryError('Query could not be completed', `HTTP ${response.statusCode}: ${message}`, {
      statusCode: response.statusCode,
      body: body as Record<string, unknown>,
    });
  }

  /**
   * ElevenLabs errors are `{ detail: { status, message } }`, `{ detail: "..." }`, or FastAPI
   * validation errors `{ detail: [{ loc, msg }] }`.
   */
  private errorMessage(body: unknown): string {
    if (typeof body === 'string') return body;
    const detail = (body as { detail?: unknown })?.detail;

    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item: { loc?: unknown[]; msg?: string }) => {
          const field = Array.isArray(item?.loc) ? item.loc.filter((part) => part !== 'body').join('.') : '';
          return field ? `${field}: ${item?.msg}` : item?.msg;
        })
        .filter(Boolean)
        .join('; ');
    }
    if (detail && typeof detail === 'object') {
      const { message, status } = detail as { message?: string; status?: string };
      return [status, message].filter(Boolean).join(' - ');
    }
    return (body as { message?: string })?.message ?? '';
  }
}
