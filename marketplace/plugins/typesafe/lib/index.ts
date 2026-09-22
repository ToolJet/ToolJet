import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import got, { HTTPError } from 'got';
import { SourceOptions, QueryOptions, Operation, Question, EvaluateRequest, EvaluateResponse, QuestionType } from './types';

export const TYPESAFE_URL = 'https://api.typesafe.ai/v1/systemone';
export const OPENROUTER_URL = 'https://openrouter.ai/api/alpha/decisions';
const TYPESAFE_DEFAULT_MODEL = 'jev-latest';
const OPENROUTER_DEFAULT_MODEL = 'typesafe/jev-1.13';
const QUESTION_TYPES: QuestionType[] = ['choice', 'score', 'noul'];

/**
 * TypeSafe's Jev is a decision model, not a chat model: it takes a state plus typed questions and
 * returns typed answers with probabilities, never text. That is why the existing OpenAI-shaped
 * connectors cannot reach it even through OpenRouter, which serves it on its own decisions endpoint.
 * Both endpoints take the same {state, model, questions} body and return the same {model, answers,
 * usage} shape, so one client serves both credentials.
 */
export default class TypeSafe implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, _dataSourceId: string): Promise<QueryResult> {
    const operation: Operation = queryOptions.operation;
    switch (operation) {
      case Operation.Evaluate: {
        const request = this.buildRequest(sourceOptions, queryOptions);
        const data = await this.evaluate(sourceOptions, request);
        return { status: 'ok', data: data as unknown as Record<string, unknown> };
      }
      default:
        throw new QueryError('Query could not be completed', `Unsupported operation: ${operation}`, {});
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      const data = await this.evaluate(sourceOptions, {
        state: 'ping',
        model: this.resolveModel(sourceOptions, undefined),
        questions: { ok: { type: 'noul', instructions: 'Is the word "ping" present in the state?' } },
      });
      if (!data?.answers?.ok) {
        return { status: 'failed', message: 'The endpoint answered but returned no answers; check the base URL.' };
      }
      return { status: 'ok' };
    } catch (error) {
      // QueryError carries the useful text in `description`; `message` is the generic title.
      const detail = error?.description ? `${error.description}` : error?.message || String(error);
      return { status: 'failed', message: detail };
    }
  }

  // ----- request assembly ---------------------------------------------------------------------

  private buildRequest(sourceOptions: SourceOptions, queryOptions: QueryOptions): EvaluateRequest {
    const state = this.parseState(queryOptions.state);
    const questions = this.parseQuestions(queryOptions.questions);
    return { state, model: this.resolveModel(sourceOptions, queryOptions.model), questions };
  }

  /** A string that parses as a JSON object or array is structured state; anything else is text. */
  private parseState(raw: QueryOptions['state']): EvaluateRequest['state'] {
    if (raw === undefined || raw === null || raw === '') {
      throw new QueryError('Query could not be completed', 'State is required: the text or record to decide about.', {});
    }
    if (typeof raw !== 'string') return raw;
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return raw; // looked like JSON but is not: send it as text rather than fail the query
      }
    }
    return raw;
  }

  /** Validates the shape TypeSafe would reject with a 422, so the error names the question instead of a field path. */
  private parseQuestions(raw: QueryOptions['questions']): Record<string, Question> {
    if (raw === undefined || raw === null || raw === '') {
      throw new QueryError('Query could not be completed', 'Questions are required: a JSON map of question id to a typed question.', {});
    }
    let parsed: unknown = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        throw new QueryError('Query could not be completed', `Questions must be valid JSON: ${error.message}`, {});
      }
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new QueryError('Query could not be completed', 'Questions must be a JSON object keyed by question id.', {});
    }
    const questions = parsed as Record<string, Question>;
    const ids = Object.keys(questions);
    if (ids.length === 0) {
      throw new QueryError('Query could not be completed', 'Questions must contain at least one question.', {});
    }
    for (const id of ids) {
      const q = questions[id];
      if (!q || typeof q !== 'object') {
        throw new QueryError('Query could not be completed', `Question "${id}" must be an object with type and instructions.`, {});
      }
      if (!QUESTION_TYPES.includes(q.type)) {
        throw new QueryError(
          'Query could not be completed',
          `Question "${id}": unknown question type "${q.type}". Use choice, score or noul.`,
          {}
        );
      }
      if (q.instructions === undefined || q.instructions === null || q.instructions === '') {
        throw new QueryError('Query could not be completed', `Question "${id}" needs instructions.`, {});
      }
      if (q.type === 'choice') {
        const options = q.criteria;
        if (!options || typeof options !== 'object' || Array.isArray(options) || Object.keys(options).length < 2) {
          throw new QueryError(
            'Query could not be completed',
            `Question "${id}": a choice needs criteria as a map of at least two options to descriptions.`,
            {}
          );
        }
      }
      if (q.type === 'score') {
        if (!Array.isArray(q.criteria) || q.criteria.length < 2) {
          throw new QueryError('Query could not be completed', `Question "${id}": a score needs criteria as an ordered list of at least two levels.`, {});
        }
      }
    }
    return questions;
  }

  private authType(sourceOptions: SourceOptions): 'typesafe' | 'openrouter' {
    return sourceOptions.auth_type === 'openrouter' ? 'openrouter' : 'typesafe';
  }

  /** OpenRouter needs a vendor-prefixed slug. TypeSafe's floating alias is served there as ~typesafe/jev-latest
   *  (the tilde marks a "latest" alias on OpenRouter); a pinned name such as jev-1.13 is typesafe/jev-1.13. */
  private resolveModel(sourceOptions: SourceOptions, requested: string | undefined): string {
    const model = (requested || '').trim();
    if (this.authType(sourceOptions) === 'openrouter') {
      if (!model) return OPENROUTER_DEFAULT_MODEL;
      if (model.includes('/')) return model;
      return model.endsWith('-latest') ? `~typesafe/${model}` : `typesafe/${model}`;
    }
    if (!model) return TYPESAFE_DEFAULT_MODEL;
    return model.replace(/^~?typesafe\//, '');
  }

  private endpoint(sourceOptions: SourceOptions): string {
    const override = (sourceOptions.base_url || '').trim();
    if (override) return override;
    return this.authType(sourceOptions) === 'openrouter' ? OPENROUTER_URL : TYPESAFE_URL;
  }

  private apiKey(sourceOptions: SourceOptions): string {
    const key = this.authType(sourceOptions) === 'openrouter' ? sourceOptions.openrouter_api_key : sourceOptions.api_key;
    if (!key || !key.trim()) {
      throw new QueryError(
        'Query could not be completed',
        this.authType(sourceOptions) === 'openrouter' ? 'OpenRouter API key is missing.' : 'TypeSafe API key is missing.',
        {}
      );
    }
    return key.trim();
  }

  // ----- transport ----------------------------------------------------------------------------

  private async evaluate(sourceOptions: SourceOptions, request: EvaluateRequest): Promise<EvaluateResponse> {
    const url = this.endpoint(sourceOptions);
    try {
      const response = await got.post(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey(sourceOptions)}`,
          'Content-Type': 'application/json',
        },
        json: request,
        responseType: 'json',
        timeout: { request: 60000 },
        // Both endpoints ask for backoff on 429 and 529; got retries idempotent methods only, so opt POST in.
        // No calculateDelay override: got treats any positive return as "retry again", limit or not.
        retry: { limit: 2, methods: ['POST'], statusCodes: [429, 503, 529] },
      });
      return response.body as EvaluateResponse;
    } catch (error) {
      throw this.asQueryError(error, url);
    }
  }

  /** Both endpoints return JSON bodies on failure; surface the API's own message and the offending field. */
  private asQueryError(error: unknown, url: string): QueryError {
    if (error instanceof QueryError) return error;
    if (error instanceof HTTPError) {
      const status = error.response.statusCode;
      const body = error.response.body as any;
      const apiMessage =
        body?.error?.metadata?.raw || body?.error?.message || body?.message || body?.detail || body?.error || '';
      const summary =
        status === 401
          ? 'API key rejected (401). Check the key for the selected authentication.'
          : status === 422 || status === 400
          ? `Request rejected (${status}): ${typeof apiMessage === 'string' ? apiMessage : JSON.stringify(apiMessage)}`
          : status === 429
          ? 'Rate limited (429). Retry shortly.'
          : status === 529
          ? 'TypeSafe is overloaded (529). Retry shortly.'
          : `HTTP ${status}: ${typeof apiMessage === 'string' && apiMessage ? apiMessage : error.message}`;
      return new QueryError('Query could not be completed', summary, {
        status,
        url,
        body: typeof body === 'object' ? body : String(body).slice(0, 1000),
      });
    }
    const message = (error as Error)?.message || String(error);
    return new QueryError('Query could not be completed', message, { url });
  }
}
