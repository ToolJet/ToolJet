import { ConnectionTestResult, QueryError, QueryResult, QueryService } from '@tooljet-marketplace/common';
import got, { HTTPError, Method } from 'got';
import { SourceOptions, QueryOptions } from './types';

export const BASE_URL = 'https://api.anakin.io/v1';
const REQUEST_TIMEOUT_MS = 60_000;

type Body = Record<string, unknown>;

/**
 * Anakin's long-running endpoints (scrape, map, crawl, agentic search, Wire tasks, AI visibility,
 * browser tasks) are submit-then-poll. A ToolJet query is one request, so each one is split into a
 * "start" operation that returns the job id and a "Get ... Result" operation that reads it; the app
 * polls with a query trigger or a button instead of the plugin blocking for minutes.
 */
export default class Anakin implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, _dataSourceId?: string): Promise<QueryResult> {
    const apiKey = str(sourceOptions.api_key);
    if (!apiKey) {
      throw new QueryError('Query could not be completed', 'API key is not set on the Anakin data source', {});
    }
    const q = queryOptions;
    const call = (method: Method, path: string, body?: Body) => request(apiKey, method, path, body);

    switch (q.operation) {
      // ── Web scraping ────────────────────────────────────────────────
      case 'scrape_url': {
        const generateJson = bool(q.generate_json) ?? false;
        const body: Body = {
          url: required(q.url, 'URL'),
          formats: generateJson ? ['markdown', 'json'] : ['markdown'],
          generateJson,
          country: str(q.country) ?? 'us',
          useBrowser: bool(q.use_browser) ?? false,
          forceFresh: bool(q.force_fresh) ?? false,
        };
        put(body, 'sessionId', str(q.session_id));
        put(body, 'sessionName', str(q.session_name));
        return ok(await call('POST', '/url-scraper', body));
      }
      case 'get_scrape_result':
        return ok(await call('GET', `/url-scraper/${seg(q.job_id, 'Job ID')}`));

      // ── Site mapping ────────────────────────────────────────────────
      case 'map': {
        const body: Body = {
          url: required(q.url, 'URL'),
          limit: num(q.limit, 'Limit') ?? 100,
          depth: num(q.depth, 'Depth') ?? 2,
          limitPerLevel: num(q.limit_per_level, 'Limit Per Level') ?? 100,
          includeSubdomains: bool(q.include_subdomains) ?? false,
          includeExternalLinks: bool(q.include_external_links) ?? false,
          useBrowser: bool(q.use_browser) ?? false,
        };
        put(body, 'search', str(q.search));
        return ok(await call('POST', '/map', body));
      }
      case 'get_map_result':
        return ok(await call('GET', `/map/${seg(q.job_id, 'Job ID')}`));

      // ── Site crawling ───────────────────────────────────────────────
      case 'crawl': {
        const body: Body = {
          url: required(q.url, 'URL'),
          maxPages: num(q.max_pages, 'Max Pages') ?? 10,
          depth: num(q.depth, 'Depth') ?? 1,
          country: str(q.country) ?? 'us',
          useBrowser: bool(q.use_browser) ?? false,
        };
        put(body, 'includePatterns', strList(q.include_patterns, 'Include Patterns'));
        put(body, 'excludePatterns', strList(q.exclude_patterns, 'Exclude Patterns'));
        put(body, 'sessionId', str(q.session_id));
        put(body, 'sessionName', str(q.session_name));
        return ok(await call('POST', '/crawl', body));
      }
      case 'get_crawl_result':
        return ok(await call('GET', `/crawl/${seg(q.job_id, 'Job ID')}`));

      // ── AI search ───────────────────────────────────────────────────
      case 'search':
        return ok(
          await call('POST', '/search', {
            prompt: required(q.prompt, 'Prompt'),
            limit: num(q.limit, 'Limit') ?? 5,
          })
        );
      case 'agentic_search': {
        const body: Body = {
          prompt: required(q.prompt, 'Prompt'),
          useBrowser: bool(q.use_browser) ?? true,
        };
        put(body, 'schema', obj(q.schema, 'Schema'));
        return ok(await call('POST', '/agentic-search', body));
      }
      case 'get_agentic_search_result':
        return ok(await call('GET', `/agentic-search/${seg(q.job_id, 'Job ID')}`));

      // ── Wire: discovery ─────────────────────────────────────────────
      case 'wire_discover':
        return ok(
          await call('GET', `/wire/resolve${qs({ q: required(q.q, 'Intent'), limit: num(q.limit, 'Limit') })}`)
        );
      case 'wire_catalog': {
        const slug = str(q.slug);
        return ok(await call('GET', slug ? `/wire/catalog/${encodeURIComponent(slug)}` : '/wire/catalog'));
      }

      // ── Wire: execution ─────────────────────────────────────────────
      // Read and write actions share POST /wire/task; they are separate operations so a builder
      // can tell from the query alone whether it changes something on the target site.
      case 'wire_read_action':
      case 'wire_write_action': {
        const body: Body = { action_id: required(q.action_id, 'Action ID') };
        const params = obj(q.params, 'Params');
        if (params && Object.keys(params).length > 0) body.params = params;
        put(body, 'credential_id', str(q.credential_id));
        put(body, 'identity_id', str(q.identity_id));
        return ok(await call('POST', '/wire/task', body));
      }
      case 'get_wire_job_result':
        return ok(await call('GET', `/wire/jobs/${seg(q.job_id, 'Job ID')}`));

      // ── Wire: identities and sign-in ────────────────────────────────
      case 'wire_identities':
        return ok(await call('GET', `/wire/identities${qs({ catalog_id: str(q.catalog_id) })}`));
      case 'wire_login': {
        const body: Body = { catalog_slug: required(q.catalog_slug, 'Catalog Slug') };
        const params = obj(q.params, 'Params');
        if (params && Object.keys(params).length > 0) body.params = params;
        put(body, 'identity_name', str(q.identity_name));
        put(body, 'source_id', str(q.source_id));
        put(body, 'source_ref', obj(q.source_ref, 'Source Ref'));
        return ok(await call('POST', '/wire/login', body));
      }

      // ── Wire: build ─────────────────────────────────────────────────
      case 'wire_build': {
        const body: Body = {
          website_url: required(q.website_url, 'Website URL'),
          goal: required(q.goal, 'Goal'),
        };
        put(body, 'catalog_id', str(q.catalog_id));
        put(body, 'visibility', str(q.visibility));
        put(body, 'force', bool(q.force));
        const actions = strList(q.actions, 'Actions');
        if (actions && actions.length > 0) body.actions = actions;
        put(body, 'country', str(q.country));
        return ok(await call('POST', '/wire/build-request', body));
      }
      case 'wire_build_status': {
        const id = str(q.id);
        if (id) {
          const result = await call('GET', `/wire/build-requests/${encodeURIComponent(id)}`);
          // The step log is verbose; drop it unless asked for, as anakin-mcp does.
          if (!bool(q.include_events) && isRecord(result) && 'events' in result) {
            const rest = { ...result };
            delete rest.events;
            return ok(rest);
          }
          return ok(result);
        }
        return ok(
          await call(
            'GET',
            `/wire/build-requests${qs({
              status: str(q.status),
              limit: num(q.limit, 'Limit') ?? 10,
              page: num(q.page, 'Page'),
            })}`
          )
        );
      }

      // ── Website monitoring ──────────────────────────────────────────
      case 'monitor_create': {
        const body: Body = {
          url: required(q.url, 'URL'),
          intervalMinutes: num(q.interval_minutes, 'Interval Minutes') ?? missing('Interval Minutes'),
        };
        // Only fields the builder set; the API applies its own defaults.
        put(body, 'scope', str(q.scope));
        put(body, 'watchMode', str(q.watch_mode));
        put(body, 'watchFormat', str(q.watch_format));
        put(body, 'outputSchema', obj(q.output_schema, 'Output Schema'));
        put(body, 'aiMode', bool(q.ai_mode));
        put(body, 'aiGoal', str(q.ai_goal));
        put(body, 'useBrowser', bool(q.use_browser));
        put(body, 'country', str(q.country));
        put(body, 'sessionId', str(q.session_id));
        put(body, 'isActive', bool(q.is_active));
        put(body, 'expiresAt', str(q.expires_at));
        put(body, 'alertWebhookUrl', str(q.alert_webhook_url));
        put(body, 'alertEmails', str(q.alert_emails));
        put(body, 'maxPages', num(q.max_pages, 'Max Pages'));
        put(body, 'maxDepth', num(q.max_depth, 'Max Depth'));
        put(body, 'includePatterns', strList(q.include_patterns, 'Include Patterns'));
        put(body, 'excludePatterns', strList(q.exclude_patterns, 'Exclude Patterns'));
        put(body, 'wireActionId', str(q.wire_action_id));
        put(body, 'wireCatalogSlug', str(q.wire_catalog_slug));
        put(body, 'wireCredentialId', str(q.wire_credential_id));
        put(body, 'wireParams', obj(q.wire_params, 'Wire Params'));
        put(body, 'wireWatchPaths', strList(q.wire_watch_paths, 'Wire Watch Paths'));
        return ok(await call('POST', '/monitors', body));
      }
      case 'monitor_list': {
        const id = str(q.id);
        return ok(await call('GET', id ? `/monitors/${encodeURIComponent(id)}` : '/monitors'));
      }
      case 'monitor_changes':
        return ok(await call('GET', `/monitors/${seg(q.id, 'Monitor ID')}/changes`));
      case 'monitor_control': {
        const base = `/monitors/${seg(q.id, 'Monitor ID')}`;
        const action = required(q.action, 'Action');
        switch (action) {
          case 'pause':
            return ok(await call('POST', `${base}/pause`));
          case 'resume':
            return ok(await call('POST', `${base}/resume`));
          case 'run_now':
            return ok(await call('POST', `${base}/run`));
          case 'delete':
            return ok(await call('DELETE', base));
          default:
            throw new QueryError(
              'Query could not be completed',
              `Unknown monitor action "${action}". Use pause, resume, run_now or delete.`,
              {}
            );
        }
      }

      // ── AI visibility ───────────────────────────────────────────────
      case 'ai_visibility_search': {
        const body: Body = { query: required(q.query, 'Query') };
        put(body, 'sources', strList(q.sources, 'Sources'));
        put(body, 'country', str(q.country));
        return ok(await call('POST', '/ai-visibility/search', body));
      }
      case 'get_ai_visibility_result':
        return ok(await call('GET', `/ai-visibility/search/${seg(q.search_id, 'Search ID')}`));
      case 'ai_visibility_sources':
        return ok(await call('GET', '/ai-visibility/sources'));

      // ── Browser sessions ────────────────────────────────────────────
      case 'session_list':
        return ok(await call('GET', `/sessions${qs({ domain: str(q.domain) })}`));
      case 'session_delete':
        return ok(await call('DELETE', `/sessions/${seg(q.id, 'Session ID')}`));

      // ── AI browser automation ───────────────────────────────────────
      case 'browser_task': {
        // Always async: the sync variant holds the request open for minutes.
        const body: Body = { prompt: required(q.prompt, 'Prompt'), async: true };
        put(body, 'url', str(q.url));
        put(body, 'session_id', str(q.session_id));
        put(body, 'max_steps', num(q.max_steps, 'Max Steps'));
        put(body, 'timeout_ms', num(q.timeout_ms, 'Timeout (ms)'));
        put(body, 'output_schema', obj(q.output_schema, 'Output Schema'));
        return ok(await call('POST', '/ai/evaluate', body));
      }
      case 'get_browser_task_result':
        return ok(await call('GET', `/ai/jobs/${seg(q.job_id, 'Job ID')}`));

      default:
        throw new QueryError('Query could not be completed', `Unknown operation: ${q.operation}`, {});
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const apiKey = str(sourceOptions.api_key);
    if (!apiKey) return { status: 'failed', message: 'API key is required' };
    try {
      // Listing build requests is authenticated and spends no credits.
      await request(apiKey, 'GET', '/wire/build-requests?limit=1');
      return { status: 'ok' };
    } catch (error) {
      const message = error instanceof QueryError ? String(error.description) : String(error);
      return { status: 'failed', message };
    }
  }
}

async function request(apiKey: string, method: Method, path: string, body?: Body): Promise<unknown> {
  try {
    const response = await got(`${BASE_URL}${path}`, {
      method,
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      ...(body !== undefined ? { json: body } : {}),
      responseType: 'json',
      timeout: REQUEST_TIMEOUT_MS,
      retry: 0,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HTTPError) {
      const status = error.response.statusCode;
      const responseBody = error.response.body;
      throw new QueryError('Query could not be completed', `HTTP ${status}: ${errorMessage(responseBody)}`, {
        status,
        body: responseBody,
      });
    }
    throw new QueryError('Query could not be completed', error instanceof Error ? error.message : String(error), {});
  }
}

/**
 * Anakin errors come as `{ error: { code, message } }` (Wire), `{ error, message }` or `{ error }`.
 */
function errorMessage(body: unknown): string {
  if (!isRecord(body)) return typeof body === 'string' && body ? body : 'request failed';
  const err = body.error;
  if (isRecord(err)) {
    const code = typeof err.code === 'string' ? `${err.code}: ` : '';
    return `${code}${typeof err.message === 'string' ? err.message : JSON.stringify(err)}`;
  }
  if (typeof body.message === 'string') return body.message;
  if (typeof err === 'string') return err;
  return JSON.stringify(body);
}

function ok(data: unknown): QueryResult {
  return { status: 'ok', data: (data ?? {}) as object };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function put(body: Body, key: string, value: unknown): void {
  if (value !== undefined) body[key] = value;
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

function invalid(field: string, why: string): never {
  throw new QueryError('Query could not be completed', `${field}: ${why}`, {});
}

function missing(field: string): never {
  return invalid(field, 'is required');
}

// Query fields arrive from ToolJet's codehinter: a `{{ }}` expression resolves to its JS value,
// anything else is a string, and an empty field is "" or undefined. Coerce each to its API type.

function str(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

function required(v: unknown, field: string): string {
  return str(v) ?? missing(field);
}

/** A required id used as a path segment. */
function seg(v: unknown, field: string): string {
  return encodeURIComponent(required(v, field));
}

function num(v: unknown, field: string): number | undefined {
  if (typeof v === 'number') return v;
  const s = str(v);
  if (s === undefined) return undefined;
  const n = Number(s);
  if (!Number.isFinite(n)) invalid(field, `expected a number, got "${s}"`);
  return n;
}

function bool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  const s = str(v)?.toLowerCase();
  if (s === undefined) return undefined;
  return s === 'true' || s === '1' || s === 'yes';
}

function parseJson(s: string, field: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return invalid(field, 'is not valid JSON');
  }
}

function obj(v: unknown, field: string): Record<string, unknown> | undefined {
  if (v === undefined || v === null) return undefined;
  if (isRecord(v)) return v;
  const s = str(v);
  if (s === undefined) return undefined;
  const parsed = parseJson(s, field);
  if (!isRecord(parsed)) invalid(field, 'expected a JSON object');
  return parsed as Record<string, unknown>;
}

/** An array of strings, a JSON array string, or a comma-separated string. */
function strList(v: unknown, field: string): string[] | undefined {
  if (v === undefined || v === null) return undefined;
  let list: unknown = v;
  if (typeof v === 'string') {
    const s = v.trim();
    if (s === '') return undefined;
    list = s.startsWith('[')
      ? parseJson(s, field)
      : s
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);
  }
  if (!Array.isArray(list) || !list.every((x) => typeof x === 'string')) {
    invalid(field, 'expected a list of strings');
  }
  return list as string[];
}
