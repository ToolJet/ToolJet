import { QueryResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import got, { OptionsOfTextResponseBody } from 'got';

export async function instantQuery(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
  if (!sourceOptions.server_url) {
    throw new Error('Server URL is required');
  }
  if (!queryOptions.iq_query) {
    throw new Error('Query is required for instant query');
  }

  const requestMethod = queryOptions.iq_requestMethod || 'get';
  const endpoint = `${sourceOptions.server_url}/api/v1/query`;
  const params = {
    query: queryOptions.iq_query,
    time: queryOptions.iq_time,
    timeout: queryOptions.iq_timeout,
    limit: queryOptions.iq_limit,
  };

  if (requestMethod === 'get') {
    return await makeGetRequest(sourceOptions, endpoint, params);
  } else {
    return await makePostRequest(sourceOptions, endpoint, params);
  }
}

export async function rangeQuery(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
  if (!sourceOptions.server_url) {
    throw new Error('Server URL is required');
  }
  if (!queryOptions.rq_query) {
    throw new Error('Query is required for range query');
  }
  if (!queryOptions.rq_start) {
    throw new Error('Start time is required for range query');
  }
  if (!queryOptions.rq_end) {
    throw new Error('End time is required for range query');
  }
  if (!queryOptions.rq_step) {
    throw new Error('Step is required for range query');
  }

  const requestMethod = queryOptions.rq_requestMethod || 'get';
  const endpoint = `${sourceOptions.server_url}/api/v1/query_range`;
  const params = {
    query: queryOptions.rq_query,
    start: queryOptions.rq_start,
    end: queryOptions.rq_end,
    step: queryOptions.rq_step,
    timeout: queryOptions.rq_timeout,
    limit: queryOptions.rq_limit,
  };

  if (requestMethod === 'get') {
    return await makeGetRequest(sourceOptions, endpoint, params);
  } else {
    return await makePostRequest(sourceOptions, endpoint, params);
  }
}

async function makeGetRequest(sourceOptions: SourceOptions, endpoint: string, params: any): Promise<QueryResult> {
  const requestOptions = buildRequestOptions(sourceOptions, 'GET');

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.append(key, String(value));
    }
  });
  requestOptions.searchParams = searchParams;

  const response = await got(endpoint, requestOptions);
  const data = JSON.parse(response.body);

  return {
    status: 'ok',
    data,
  };
}

async function makePostRequest(sourceOptions: SourceOptions, endpoint: string, params: any): Promise<QueryResult> {
  const requestOptions = buildRequestOptions(sourceOptions, 'POST');

  const formData: { [key: string]: string } = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      formData[key] = String(value);
    }
  });

  requestOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  requestOptions.form = formData;

  const response = await got(endpoint, requestOptions);
  const data = JSON.parse(response.body);

  return {
    status: 'ok',
    data,
  };
}

export function buildRequestOptions(sourceOptions: SourceOptions, method: string): OptionsOfTextResponseBody {
  const headers = { Accept: 'application/json' };

  if (sourceOptions.username && sourceOptions.password) {
    const credentials = Buffer.from(`${sourceOptions.username}:${sourceOptions.password}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  const requestOptions: OptionsOfTextResponseBody = {
    method,
    headers,
    ...getHttpsOptions(sourceOptions),
  };

  return requestOptions;
}

function getHttpsOptions(sourceOptions: SourceOptions) {
  let httpsParams: any = {};

  if (sourceOptions.tls_certificate === 'ca_certificate' && sourceOptions.ca_cert) {
    httpsParams = {
      https: {
        certificateAuthority: [sourceOptions.ca_cert],
      },
    };
  } else if (sourceOptions.tls_certificate === 'client_certificate') {
    httpsParams = {
      https: {
        certificateAuthority: sourceOptions.ca_cert ? [sourceOptions.ca_cert] : undefined,
        key: sourceOptions.client_key ? [sourceOptions.client_key] : undefined,
        certificate: sourceOptions.client_cert ? [sourceOptions.client_cert] : undefined,
      },
    };
  }

  return httpsParams;
}
