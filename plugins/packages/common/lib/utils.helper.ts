import { QueryError } from './query.error';
import { Headers } from 'got';
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

export const sanitizeHeaders = (sourceOptions: any, queryOptions: any, hasDataSource = true): Headers => {
  const _headers = (queryOptions.headers || []).filter((o) => {
    return o.some((e) => !isEmpty(e));
  });

  if (!hasDataSource) return Object.fromEntries(_headers);

  const headerData = _headers.concat(sourceOptions.headers || []);
  const headers = Object.fromEntries(headerData);
  Object.keys(headers).forEach((key) => (headers[key] === '' ? delete headers[key] : {}));

  return headers;
};

export const sanitizeSearchParams = (sourceOptions: any, queryOptions: any, hasDataSource = true): object => {
  const _urlParams = (queryOptions.url_params || []).filter((o) => {
    return o.some((e) => !isEmpty(e));
  });

  if (!hasDataSource) return Object.fromEntries(_urlParams);

  const urlParams = _urlParams.concat(sourceOptions.url_params || []);
  return Object.fromEntries(urlParams);
};

export const fetchHttpsCertsForCustomCA = () => {
  if (!process.env.NODE_EXTRA_CA_CERTS) return {};

  return {
    https: {
      certificateAuthority: [...tls.rootCertificates, readFileSync(process.env.NODE_EXTRA_CA_CERTS)].join('\n'),
    },
  };
};
