export type QueryErrorCategory =
  | 'authentication'
  | 'connection'
  | 'schema_name'
  | 'timeout'
  | 'rate_limit'
  | 'transient'
  | 'query'
  | 'unknown';

const codeSet = (codes: string) => new Set(codes.split(' '));
const AUTH_CODES = codeSet(
  '13 16 18 401 403 1045 18456 ELOGIN ER_ACCESS_DENIED_ERROR ER_DBACCESS_DENIED_ERROR EAUTH AUTHENTICATION_REQUIRED INVALIDCREDENTIALS STRIPEAUTHENTICATIONERROR UNAUTHENTICATED UNRECOGNIZEDCLIENTEXCEPTION NJS-116 ORA-01017'
);
const CONNECTION_CODES = codeSet(
  '14 1049 2002 2003 2005 CONNECTIONERROR EAI_AGAIN ECONNABORTED ECONNREFUSED ECONNRESET EHOSTUNREACH ENETUNREACH ENOTFOUND ESOCKET MONGONETWORKERROR MONGOSERVERSELECTIONERROR NETWORKINGERROR PROTOCOL_CONNECTION_LOST NJS-500 ORA-12154 ORA-12514 ORA-12541'
);
const SCHEMA_CODES = codeSet(
  '26 207 208 1054 1146 42703 42P01 3F000 ER_BAD_FIELD_ERROR ER_BAD_TABLE_ERROR ER_NO_SUCH_TABLE NAMESPACENOTFOUND ORA-00904 ORA-00942'
);
const TIMEOUT_CODES = codeSet(
  '4 408 504 DEADLINE_EXCEEDED ETIMEDOUT ETIMEOUT KNEXTIMEOUTERROR REQUEST_TIMEOUT TIMEOUTERROR'
);
const RATE_LIMIT_CODES = codeSet('429 RATELIMITEXCEEDED RESOURCE_EXHAUSTED THROTTLINGEXCEPTION TOOMANYREQUESTS');

function structuredErrorFacts(...values: unknown[]): { codes: Set<string>; statuses: Set<number> } {
  const codes = new Set<string>();
  const statuses = new Set<number>();
  const seen = new Set<object>();
  let inspectedFields = 0;
  const visit = (value: unknown, depth = 0): void => {
    if (!value || typeof value !== 'object' || depth > 4 || seen.size >= 64 || seen.has(value as object)) return;
    seen.add(value as object);
    let entries: [string, unknown][];
    try {
      entries = Object.entries(value as Record<string, unknown>);
    } catch {
      return;
    }
    for (const [key, child] of entries) {
      if (inspectedFields++ >= 128) return;
      const field = key.replace(/[_-]/g, '').toLowerCase();
      if (['code', 'codename', 'sqlstate', 'state', 'errno', 'number', 'name', 'type'].includes(field)) {
        if (typeof child === 'string' || typeof child === 'number') codes.add(String(child).trim().toUpperCase());
      }
      if (['status', 'statuscode', 'httpstatus', 'httpstatuscode', 'responsecode'].includes(field)) {
        const status = typeof child === 'number' ? child : Number(child);
        if (Number.isInteger(status)) statuses.add(status);
        else if (typeof child === 'string') codes.add(child.trim().toUpperCase());
      }
      if (['body', 'responsebody', 'headers', 'requestobject'].includes(field)) continue;
      visit(child, depth + 1);
    }
  };
  values.forEach((value) => visit(value));
  return { codes, statuses };
}

/** Classifies only structured driver/API fields. Human-readable messages are never inspected. */
export function classifyQueryErrorCategory(data: unknown, description?: unknown): QueryErrorCategory {
  const { codes, statuses } = structuredErrorFacts(data, description);
  const has = (set: Set<string>) => [...codes].some((code) => set.has(code));
  const sqlStates = [...codes].filter((code) => /^[0-9A-Z]{5}$/.test(code));

  if (
    has(AUTH_CODES) ||
    sqlStates.some((code) => code.startsWith('28')) ||
    [...statuses].some((status) => status === 401 || status === 403)
  )
    return 'authentication';
  if (has(SCHEMA_CODES) || sqlStates.some((code) => ['42P02', '42704'].includes(code))) return 'schema_name';
  if (has(TIMEOUT_CODES) || [...statuses].some((s) => s === 408 || s === 504)) return 'timeout';
  if (has(RATE_LIMIT_CODES) || statuses.has(429)) return 'rate_limit';
  if (has(CONNECTION_CODES) || sqlStates.some((code) => code.startsWith('08') || code === '3D000')) return 'connection';
  if (
    sqlStates.some((code) => code.startsWith('53') || code.startsWith('57P0')) ||
    [...statuses].some((status) => status >= 500)
  )
    return 'transient';
  if (sqlStates.length || [...statuses].some((status) => status >= 400 && status < 500)) return 'query';
  return 'unknown';
}

export class QueryError extends Error {
  data: Record<string, unknown>;
  description: any;
  metadata?: unknown;
  category: QueryErrorCategory;
  constructor(
    message: string | undefined,
    description: unknown,
    data: Record<string, unknown>,
    metadata?: unknown,
    category?: QueryErrorCategory
  ) {
    super(message);
    this.name = this.constructor.name;
    this.data = data;
    this.description = description;
    this.metadata = metadata;
    this.category = category ?? classifyQueryErrorCategory(data, description);
  }
}

export class OAuthUnauthorizedClientError extends Error {
  data: Record<string, unknown>;
  description: any;
  category: QueryErrorCategory = 'authentication';
  constructor(message: string | undefined, description: any, data: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.data = data;
    this.description = description;
  }
}
