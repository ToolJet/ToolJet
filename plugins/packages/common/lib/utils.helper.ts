import { QueryError } from './query.error';
import * as tls from 'tls';
import { readFileSync } from 'fs';

const CACHED_CONNECTIONS: any = {};

export function parseJson(jsonString: string, errorMessage?: string): object {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    throw new QueryError(errorMessage, err.message, {});
  }
}

export function cacheConnection(dataSourceId: string, connection: any): any {
  const updatedAt = new Date();
  CACHED_CONNECTIONS[dataSourceId] = { connection, updatedAt };
}

export function getCachedConnection(dataSourceId: string | number, dataSourceUpdatedAt: any): any {
  const cachedData = CACHED_CONNECTIONS[dataSourceId];

  if (cachedData) {
    const updatedAt = new Date(dataSourceUpdatedAt || null);
    const cachedAt = new Date(cachedData.updatedAt || null);

    const diffTime = (cachedAt.getTime() - updatedAt.getTime()) / 1000;

    if (diffTime < 0) {
      return null;
    } else {
      return cachedData['connection'];
    }
  }
}

export function cleanSensitiveData(data, keys) {
  if (!data || typeof data !== 'object') return;

  const dataObj = { ...data };
  clearData(dataObj, keys);
  return dataObj;
}

function clearData(data, keys) {
  if (!data || typeof data !== 'object') return;

  for (const key in data) {
    if (keys.includes(key)) {
      delete data[key];
    } else {
      clearData(data[key], keys);
    }
  }
}

export function isEmpty(value: number | null | undefined | string) {
  return (
    value === undefined ||
    value === null ||
    !isNaN(value as number) ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0)
  );
}

export const getCurrentToken = (isMultiAuthEnabled: boolean, tokenData: any, userId: string, isAppPublic: boolean) => {
  if (isMultiAuthEnabled) {
    if (!tokenData || !Array.isArray(tokenData)) return null;
    return !isAppPublic
      ? tokenData.find((token: any) => token.user_id === userId)
      : userId
      ? tokenData.find((token: any) => token.user_id === userId)
      : tokenData[0];
  } else {
    return tokenData;
  }
};

export const sanitizeHeaders = (
  sourceOptions: any,
  queryOptions: any,
  hasDataSource = true
): { [k: string]: string } => {
  const cleanHeaders = (headers) => headers.filter(([k, _]) => k !== '').map(([k, v]) => [k.trim(), v]);
  const filterValidHeaderEntries = (headers) => {
    return headers.filter(([_, value]) => {
      if (value == null) return false;
      if (typeof value === 'string') return true;
      if (Array.isArray(value) && value.every((v) => typeof v === 'string')) return true;
      return false;
    });
  };

  const processHeaders = (rawHeaders) => {
    const cleaned = cleanHeaders(rawHeaders || []);
    const validHeaders = filterValidHeaderEntries(cleaned);
    return Object.fromEntries(validHeaders);
  };

  const queryHeaders = processHeaders(queryOptions.headers || []);

  if (!hasDataSource) return queryHeaders;

  const sourceHeaders = processHeaders(sourceOptions.headers || []);

  return { ...queryHeaders, ...sourceHeaders };
};

export const sanitizeCookies = (sourceOptions: any, queryOptions: any, hasDataSource = true): object => {
  const _cookies = (queryOptions.cookies || []).filter((o) => {
    return o.some((e) => !isEmpty(e));
  });

  if (!hasDataSource) return Object.fromEntries(_cookies);

  const cookieData = _cookies.concat(sourceOptions.cookies || []);
  const cookies = Object.fromEntries(cookieData);
  Object.keys(cookies).forEach((key) => (cookies[key] === '' ? delete cookies[key] : {}));

  return cookies;
};

export const cookiesToString = (cookies: object): string => {
  return Object.entries(cookies)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
    .join('; ');
};

export const sanitizeSearchParams = (sourceOptions: any, queryOptions: any, hasDataSource = true): Array<string> => {
  const _urlParams = (queryOptions.url_params || []).filter((o) => {
    return o.some((e) => !isEmpty(e));
  });

  if (!hasDataSource) return _urlParams;
  const sanitisedUrlParamsFromSourceOptions = (sourceOptions.url_params || []).filter((o) => {
    return o.some((e) => !isEmpty(e));
  });

  const urlParams = _urlParams.concat(sanitisedUrlParamsFromSourceOptions || []);
  return urlParams;
};

export const sanitizeSortPairs = (options): Array<[string, string]> => {
  const sanitizedOptions = (options || []).filter((o) => {
    return o.every((e) => !isEmpty(e));
  });
  return sanitizedOptions;
};

export const fetchHttpsCertsForCustomCA = () => {
  if (!process.env.NODE_EXTRA_CA_CERTS) return {};

  return {
    https: {
      certificateAuthority: [...tls.rootCertificates, readFileSync(process.env.NODE_EXTRA_CA_CERTS)].join('\n'),
    },
  };
};

// Headers to be redacted
// For more information on OWASP Secure Headers Project, visit:
// https://owasp.org/www-project-secure-headers/#prevent-information-disclosure-via-http-headers

const headersToRedact = [
  '$wsep',
  'Host-Header',
  'K-Proxy-Request',
  'Liferay-Portal',
  'OracleCommerceCloud-Version',
  'Pega-Host',
  'Powered-By',
  'Product',
  'Server',
  'SourceMap',
  'X-AspNet-Version',
  'X-AspNetMvc-Version',
  'X-Atmosphere-error',
  'X-Atmosphere-first-request',
  'X-Atmosphere-tracking-id',
  'X-B3-ParentSpanId',
  'X-B3-Sampled',
  'X-B3-SpanId',
  'X-B3-TraceId',
  'X-BEServer',
  'X-CF-Powered-By',
  'X-CMS',
  'X-CalculatedBETarget',
  'X-Cocoon-Version',
  'X-Content-Encoded-By',
  'X-DiagInfo',
  'X-Envoy-Attempt-Count',
  'X-Envoy-External-Address',
  'X-Envoy-Internal',
  'X-Envoy-Original-Dst-Host',
  'X-Envoy-Upstream-Service-Time',
  'X-FEServer',
  'X-Framework',
  'X-Generated-By',
  'X-Generator',
  'X-Jitsi-Release',
  'X-Kubernetes-PF-FlowSchema-UI',
  'X-Kubernetes-PF-PriorityLevel-UID',
  'X-LiteSpeed-Cache',
  'X-LiteSpeed-Purge',
  'X-LiteSpeed-Tag',
  'X-LiteSpeed-Vary',
  'X-Litespeed-Cache-Control',
  'X-Mod-Pagespeed',
  'X-Nextjs-Cache',
  'X-Nextjs-Matched-Path',
  'X-Nextjs-Page',
  'X-Nextjs-Redirect',
  'X-OWA-Version',
  'X-Old-Content-Length',
  'X-OneAgent-JS-Injection',
  'X-Page-Speed',
  'X-Php-Version',
  'X-Powered-By',
  'X-Powered-By-Plesk',
  'X-Powered-CMS',
  'X-Redirect-By',
  'X-Server-Powered-By',
  'X-SourceFiles',
  'X-SourceMap',
  'X-Turbo-Charged-By',
  'X-Umbraco-Version',
  'X-Varnish-Backend',
  'X-Varnish-Server',
  'X-dtAgentId',
  'X-dtHealthCheck',
  'X-dtInjectedServlet',
  'X-ruxit-JS-Agent',
  'server',
  // Additional headers explicitly defined for redaction
  'authorization', // Contains sensitive authentication information
  'x-api-key', // Often used for API authentication
  'proxy-authorization', // Similar to authorization, but for proxy authentication
  'www-authenticate', // Contains authentication scheme information
  'authentication-info', // Provides additional authentication details
];

export const redactHeaders = (headers) => {
  const redactedHeaders = { ...headers };
  headersToRedact.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(redactedHeaders, key)) {
      redactedHeaders[key] = '[REDACTED]';
    }
  });
  return redactedHeaders;
};
