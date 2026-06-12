import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import got, { OptionsOfJSONResponseBody } from 'got';
import { SourceOptions, QueryOptions } from './types';

export default class Servicenow implements QueryService {
  private trimUrl(instanceUrl: string): string {
    return (instanceUrl || '').replace(/\/+$/, '');
  }

  private async authHeaders(sourceOptions: SourceOptions): Promise<Record<string, string>> {
    const baseUrl = this.trimUrl(sourceOptions.instance_url);

    if (sourceOptions.auth_type === 'oauth2') {
      const tokenResponse = await got.post(`${baseUrl}/oauth_token.do`, {
        form: {
          grant_type: 'password',
          client_id: sourceOptions.client_id,
          client_secret: sourceOptions.client_secret,
          username: sourceOptions.oauth_username,
          password: sourceOptions.oauth_password,
        },
        responseType: 'json',
      });

      const accessToken = (tokenResponse.body as { access_token?: string })?.access_token;
      return { Authorization: `Bearer ${accessToken}` };
    }

    // Default: basic auth
    const credentials = Buffer.from(`${sourceOptions.username}:${sourceOptions.password}`).toString('base64');
    return { Authorization: `Basic ${credentials}` };
  }

  private parseBody(body: QueryOptions['body']): Record<string, unknown> {
    if (body === undefined || body === null || body === '') {
      return {};
    }
    if (typeof body === 'object') {
      return body as Record<string, unknown>;
    }
    return JSON.parse(body);
  }

  // ---- Action Fabric (MCP) ------------------------------------------------

  // Resolve the MCP server URL: absolute URL as-is, a path appended to instance_url,
  // or the default native MCP server path `${instance_url}/sncapps/mcp-server/mcp/sn_mcp_server_default`.
  // (Custom MCP servers use a different name after /mcp/ — set mcp_endpoint to override.)
  private mcpEndpoint(sourceOptions: SourceOptions): string {
    const base = this.trimUrl(sourceOptions.instance_url);
    const configured = (sourceOptions.mcp_endpoint || '').trim();
    if (!configured) return `${base}/sncapps/mcp-server/mcp/sn_mcp_server_default`;
    if (/^https?:\/\//i.test(configured)) return configured;
    return `${base}/${configured.replace(/^\/+/, '')}`;
  }

  // Resolve the Scripted REST flow-trigger URL from flow_trigger_path (absolute URL, or a
  // path appended to instance_url). Required for the trigger_flow operation.
  private flowTriggerEndpoint(sourceOptions: SourceOptions): string {
    const base = this.trimUrl(sourceOptions.instance_url);
    const configured = (sourceOptions.flow_trigger_path || '').trim();
    if (!configured) {
      throw new QueryError(
        'Flow trigger endpoint not configured',
        'Set "Flow trigger path" on the ServiceNow datasource to your Scripted REST resource path (e.g. /api/<scope>/tooljet_flow/run).',
        {}
      );
    }
    if (/^https?:\/\//i.test(configured)) return configured;
    return `${base}/${configured.replace(/^\/+/, '')}`;
  }

  // Extract the JSON-RPC payload from a response body that may be raw JSON or
  // SSE-framed (`event:`/`data:` lines, used by the Streamable HTTP transport).
  private parseJsonRpc(rawBody: string): { result?: unknown; error?: { code?: number; message?: string } } {
    const text = (rawBody || '').trim();
    if (!text) return {};
    if (text.startsWith('{') || text.startsWith('[')) {
      return JSON.parse(text);
    }
    // SSE: take the last non-empty `data:` line (the JSON-RPC response).
    const dataLines = text
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .filter((d) => d && d !== '[DONE]');
    if (!dataLines.length) return {};
    return JSON.parse(dataLines[dataLines.length - 1]);
  }

  // Throw a clear error when an MCP HTTP response isn't a JSON-RPC payload — i.e. a 3xx
  // redirect or an HTML page (ServiceNow login). Otherwise the caller would silently get
  // an empty result instead of an actionable error.
  private assertMcpHttpOk(
    res: { statusCode: number; headers: Record<string, string | string[] | undefined>; body: string },
    step: string,
    url: string
  ): void {
    const ct = String(res.headers['content-type'] || '');
    if (res.statusCode >= 300 && res.statusCode < 400) {
      const location = String(res.headers['location'] || '');
      throw new QueryError(
        'Action Fabric MCP endpoint is not reachable as a token API',
        `MCP ${step} got HTTP ${res.statusCode} (redirect${
          location ? ' → ' + location : ''
        }) at ${url}. This endpoint expects a browser session, not a bearer token — the MCP server is likely not enabled for external/token access, your OAuth client may not be a registered inbound client, or mcp_endpoint is wrong.`,
        { step, status: res.statusCode, location, url }
      );
    }
    if (/text\/html/i.test(ct)) {
      throw new QueryError(
        'Action Fabric MCP endpoint returned an HTML page',
        `MCP ${step} returned HTML (content-type "${ct}"), not JSON-RPC, at ${url} — typically a ServiceNow login page. Verify the MCP server is enabled for token auth, your OAuth client is a registered inbound client, and mcp_endpoint is correct.`,
        { step, contentType: ct, url, bodyPreview: String(res.body || '').slice(0, 200) }
      );
    }
  }

  // Minimal MCP client over Streamable HTTP: initialize (capture session) →
  // notifications/initialized → <method>. Returns the JSON-RPC result.
  private async mcpRequest(
    sourceOptions: SourceOptions,
    method: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    const url = this.mcpEndpoint(sourceOptions);
    const authHeaders = await this.authHeaders(sourceOptions);
    const baseHeaders: Record<string, string> = {
      ...authHeaders,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };

    const post = (headers: Record<string, string>, payload: Record<string, unknown>) =>
      // followRedirect:false so a 302 (ServiceNow session/login redirect) surfaces as a
      // real response we can detect, instead of silently following it to an HTML login page.
      got.post(url, { headers, json: payload, responseType: 'text', throwHttpErrors: true, followRedirect: false });

    // 1) initialize
    const initRes = await post(baseHeaders, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'tooljet-servicenow', version: '1.0.0' },
      },
    });
    const sessionId = (initRes.headers['mcp-session-id'] as string) || '';
    const sessionHeaders = sessionId ? { ...baseHeaders, 'Mcp-Session-Id': sessionId } : baseHeaders;

    this.assertMcpHttpOk(initRes, 'initialize', url);
    const initParsed = this.parseJsonRpc(initRes.body);
    if (initParsed.error) {
      throw new QueryError('MCP initialize failed', initParsed.error.message || 'initialize error', initParsed.error);
    }

    // 2) notifications/initialized (best-effort; ignore failures)
    try {
      await post(sessionHeaders, { jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
    } catch {
      /* notification is fire-and-forget */
    }

    // 3) the actual method
    const res = await post(sessionHeaders, { jsonrpc: '2.0', id: 2, method, params });
    this.assertMcpHttpOk(res, method, url);
    const parsed = this.parseJsonRpc(res.body);
    if (parsed.error) {
      throw new QueryError(`MCP ${method} failed`, parsed.error.message || `${method} error`, parsed.error);
    }
    return parsed.result;
  }

  private buildSearchParams(queryOptions: QueryOptions): Record<string, string> {
    const searchParams: Record<string, string> = {};
    const keys: (keyof QueryOptions)[] = [
      'sysparm_query',
      'sysparm_limit',
      'sysparm_offset',
      'sysparm_fields',
      'sysparm_display_value',
    ];

    for (const key of keys) {
      const value = queryOptions[key];
      if (value !== undefined && value !== null && `${value}` !== '') {
        searchParams[key] = `${value}`;
      }
    }

    return searchParams;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId?: string
  ): Promise<QueryResult> {
    const baseUrl = `${this.trimUrl(sourceOptions.instance_url)}/api/now/table`;
    const { operation, table } = queryOptions;

    try {
      const headers = await this.authHeaders(sourceOptions);

      let response;

      switch (operation) {
        case 'list_tables': {
          const options: OptionsOfJSONResponseBody = {
            method: 'GET',
            headers: { ...headers, Accept: 'application/json' },
            responseType: 'json',
          };
          const searchParams: Record<string, string> = {
            sysparm_fields: 'name,label,sys_scope,sys_id',
          };
          const nameFilter = queryOptions.name_filter;
          if (nameFilter !== undefined && nameFilter !== null && `${nameFilter}` !== '') {
            searchParams.sysparm_query = `nameLIKE${nameFilter}^ORlabelLIKE${nameFilter}`;
          }
          if (
            queryOptions.sysparm_limit !== undefined &&
            queryOptions.sysparm_limit !== null &&
            `${queryOptions.sysparm_limit}` !== ''
          ) {
            searchParams.sysparm_limit = `${queryOptions.sysparm_limit}`;
          }
          options.searchParams = searchParams;
          response = await got(`${baseUrl}/sys_db_object`, options);
          break;
        }

        case 'list_records': {
          const options: OptionsOfJSONResponseBody = {
            method: 'GET',
            headers: { ...headers, Accept: 'application/json' },
            responseType: 'json',
          };
          const searchParams = this.buildSearchParams(queryOptions);
          if (Object.keys(searchParams).length > 0) {
            options.searchParams = searchParams;
          }
          response = await got(`${baseUrl}/${table}`, options);
          break;
        }

        case 'get_record': {
          const options: OptionsOfJSONResponseBody = {
            method: 'GET',
            headers: { ...headers, Accept: 'application/json' },
            responseType: 'json',
          };
          const searchParams: Record<string, string> = {};
          if (queryOptions.sysparm_fields) {
            searchParams.sysparm_fields = `${queryOptions.sysparm_fields}`;
          }
          if (queryOptions.sysparm_display_value) {
            searchParams.sysparm_display_value = `${queryOptions.sysparm_display_value}`;
          }
          if (Object.keys(searchParams).length > 0) {
            options.searchParams = searchParams;
          }
          response = await got(`${baseUrl}/${table}/${encodeURIComponent(queryOptions.sys_id)}`, options);
          break;
        }

        case 'create_record': {
          const options: OptionsOfJSONResponseBody = {
            method: 'POST',
            headers: { ...headers, Accept: 'application/json', 'Content-Type': 'application/json' },
            responseType: 'json',
            json: this.parseBody(queryOptions.body),
          };
          response = await got(`${baseUrl}/${table}`, options);
          break;
        }

        case 'update_record': {
          const options: OptionsOfJSONResponseBody = {
            method: 'PATCH',
            headers: { ...headers, Accept: 'application/json', 'Content-Type': 'application/json' },
            responseType: 'json',
            json: this.parseBody(queryOptions.body),
          };
          response = await got(`${baseUrl}/${table}/${encodeURIComponent(queryOptions.sys_id)}`, options);
          break;
        }

        case 'delete_record': {
          const options: OptionsOfJSONResponseBody = {
            method: 'DELETE',
            headers: { ...headers, Accept: 'application/json' },
            responseType: 'json',
          };
          response = await got(`${baseUrl}/${table}/${encodeURIComponent(queryOptions.sys_id)}`, options);
          break;
        }

        case 'get_table_schema': {
          const options: OptionsOfJSONResponseBody = {
            method: 'GET',
            headers: { ...headers, Accept: 'application/json' },
            responseType: 'json',
          };
          const searchParams: Record<string, string> = {
            sysparm_query: `name=${table}^elementISNOTEMPTY`,
            sysparm_fields: 'element,column_label,internal_type,reference,mandatory,max_length,read_only,default_value',
            // Raw values (display_value=false) for introspection: internal_type returns a
            // clean type string ("string"/"choice"/"reference") and `reference` returns the
            // target TABLE NAME. With display_value=true, reference fields come back as
            // { value, display_value, link } objects (breaks schema parsing) and `reference`
            // returns a label instead of the table name (breaks relationship traversal).
            sysparm_display_value: 'false',
          };
          if (
            queryOptions.sysparm_limit !== undefined &&
            queryOptions.sysparm_limit !== null &&
            `${queryOptions.sysparm_limit}` !== ''
          ) {
            searchParams.sysparm_limit = `${queryOptions.sysparm_limit}`;
          }
          options.searchParams = searchParams;
          response = await got(`${baseUrl}/sys_dictionary`, options);
          break;
        }

        case 'get_field_choices': {
          const options: OptionsOfJSONResponseBody = {
            method: 'GET',
            headers: { ...headers, Accept: 'application/json' },
            responseType: 'json',
          };
          const language =
            queryOptions.language !== undefined && `${queryOptions.language}` !== '' ? `${queryOptions.language}` : 'en';
          options.searchParams = {
            sysparm_query: `name=${table}^element=${queryOptions.field}^inactive=false^language=${language}^ORDERBYsequence`,
            sysparm_fields: 'label,value,sequence',
          };
          response = await got(`${baseUrl}/sys_choice`, options);
          break;
        }

        case 'aggregate': {
          const statsUrl = `${this.trimUrl(sourceOptions.instance_url)}/api/now/stats/${table}`;
          const options: OptionsOfJSONResponseBody = {
            method: 'GET',
            headers: { ...headers, Accept: 'application/json' },
            responseType: 'json',
          };
          const searchParams: Record<string, string> = {};
          const count = queryOptions.sysparm_count;
          searchParams.sysparm_count = count !== undefined && `${count}` !== '' ? `${count}` : 'true';
          const optionalKeys: (keyof QueryOptions)[] = [
            'sysparm_query',
            'sysparm_group_by',
            'sysparm_avg',
            'sysparm_sum',
            'sysparm_min',
            'sysparm_max',
          ];
          for (const key of optionalKeys) {
            const value = queryOptions[key];
            if (value !== undefined && value !== null && `${value}` !== '') {
              searchParams[key] = `${value}`;
            }
          }
          options.searchParams = searchParams;
          response = await got(statsUrl, options);
          break;
        }

        case 'list_workflows': {
          // Action Fabric MCP: enumerate available workflow tools (subflows).
          const mcpResult = (await this.mcpRequest(sourceOptions, 'tools/list', {})) as {
            tools?: Array<{ name?: string }>;
          };
          let tools = Array.isArray(mcpResult?.tools) ? mcpResult.tools : [];
          const nameFilter = queryOptions.name_filter;
          if (nameFilter !== undefined && nameFilter !== null && `${nameFilter}` !== '') {
            const f = `${nameFilter}`.toLowerCase();
            tools = tools.filter((t) => (t?.name || '').toLowerCase().includes(f));
          }
          return { status: 'ok', data: tools as unknown as object[] };
        }

        case 'invoke_workflow': {
          // Action Fabric MCP: invoke a workflow tool (synchronous subflow).
          const mcpResult = (await this.mcpRequest(sourceOptions, 'tools/call', {
            name: queryOptions.workflow,
            arguments: this.parseBody(queryOptions.arguments),
          })) as { content?: unknown; isError?: boolean } | undefined;
          if (mcpResult?.isError) {
            throw new QueryError(
              'Workflow invocation returned an error',
              'The ServiceNow workflow tool reported isError',
              (mcpResult ?? {}) as Record<string, unknown>
            );
          }
          return { status: 'ok', data: (mcpResult ?? {}) as object };
        }

        case 'trigger_flow': {
          // Run a ServiceNow subflow via a customer-provided Scripted REST resource.
          // POSTs { subflow, inputs } and returns the resource's response (flow outputs) as-is.
          const flowUrl = this.flowTriggerEndpoint(sourceOptions);
          const flowRes = await got.post(flowUrl, {
            headers: { ...headers, Accept: 'application/json', 'Content-Type': 'application/json' },
            json: { subflow: queryOptions.subflow, inputs: this.parseBody(queryOptions.inputs) },
            responseType: 'json',
          });
          // Scripted REST wraps a returned value in { result: ... }; unwrap for consistency
          // (so bindings are queries.X.data.outputs, not data.result.outputs).
          const flowBody = flowRes.body as { result?: object | object[] };
          const flowData = (flowBody && typeof flowBody === 'object' && 'result' in flowBody
            ? flowBody.result
            : flowBody) as object | object[];
          return { status: 'ok', data: flowData };
        }

        case 'list_flows': {
          // Discover ServiceNow subflows via the Table API (sys_hub_flow) — REST alternative
          // to the MCP list_workflows. internal_name + sys_scope.scope identify a subflow for trigger_flow.
          const options: OptionsOfJSONResponseBody = {
            method: 'GET',
            headers: { ...headers, Accept: 'application/json' },
            responseType: 'json',
          };
          const searchParams: Record<string, string> = {
            sysparm_fields: 'sys_id,name,internal_name,sys_scope.scope,description,active',
            sysparm_query: 'type=subflow^active=true',
          };
          const nameFilter = queryOptions.name_filter;
          if (nameFilter !== undefined && nameFilter !== null && `${nameFilter}` !== '') {
            searchParams.sysparm_query = `type=subflow^active=true^nameLIKE${nameFilter}^ORinternal_nameLIKE${nameFilter}`;
          }
          if (
            queryOptions.sysparm_limit !== undefined &&
            queryOptions.sysparm_limit !== null &&
            `${queryOptions.sysparm_limit}` !== ''
          ) {
            searchParams.sysparm_limit = `${queryOptions.sysparm_limit}`;
          }
          options.searchParams = searchParams;
          response = await got(`${baseUrl}/sys_hub_flow`, options);
          break;
        }

        default: {
          throw new Error(`Unsupported operation: ${operation}`);
        }
      }

      // ServiceNow's Table/Stats/sys_* APIs wrap their payload in a `result` key.
      // Unwrap it so `data` is the array/object directly — consistent with other
      // ToolJet plugins (e.g. list_records → `data` is the array of records).
      const body = response.body as { result?: object | object[] };
      const data = (body && typeof body === 'object' && 'result' in body ? body.result : body) as object | object[];

      return {
        status: 'ok',
        data,
      };
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, error.response?.body || {});
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      const baseUrl = this.trimUrl(sourceOptions.instance_url);
      const headers = await this.authHeaders(sourceOptions);

      await got(`${baseUrl}/api/now/table/sys_user`, {
        method: 'GET',
        headers: { ...headers, Accept: 'application/json' },
        searchParams: { sysparm_limit: '1' },
        responseType: 'json',
      });

      return { status: 'ok' };
    } catch (error) {
      return { status: 'failed', message: error.message };
    }
  }
}
