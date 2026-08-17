import { QueryResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import got, { OptionsOfTextResponseBody } from 'got';

export const BASE_URL = 'https://api.serply.io/v1';

export async function webSearch(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
  if (!queryOptions.ws_query) {
    throw new Error('Query is required for web search');
  }

  const params = {
    q: queryOptions.ws_query,
    num: queryOptions.ws_num,
  };

  return await makeGetRequest(sourceOptions, `${BASE_URL}/search/${encodeQuery(params)}`);
}

export async function newsSearch(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
  if (!queryOptions.ns_query) {
    throw new Error('Query is required for news search');
  }

  const params = {
    q: queryOptions.ns_query,
    num: queryOptions.ns_num,
  };

  return await makeGetRequest(sourceOptions, `${BASE_URL}/news/${encodeQuery(params)}`);
}

export async function redditPost(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
  if (!queryOptions.rp_id) {
    throw new Error('Post ID is required for reddit post');
  }

  return await makeGetRequest(sourceOptions, `${BASE_URL}/reddit/post/${encodeURIComponent(queryOptions.rp_id)}`);
}

export async function redditComments(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
  if (!queryOptions.rc_id) {
    throw new Error('Post ID is required for reddit comments');
  }

  const params = {
    limit: queryOptions.rc_limit,
    sort: queryOptions.rc_sort,
  };

  return await makeGetRequest(
    sourceOptions,
    `${BASE_URL}/reddit/comments/${encodeURIComponent(queryOptions.rc_id)}`,
    params
  );
}

function encodeQuery(params: { [key: string]: string | undefined }): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

async function makeGetRequest(
  sourceOptions: SourceOptions,
  endpoint: string,
  params?: { [key: string]: string | undefined }
): Promise<QueryResult> {
  const requestOptions = buildRequestOptions(sourceOptions);

  if (params) {
    requestOptions.searchParams = encodeQuery(params);
  }

  const response = await got(endpoint, requestOptions);
  const data = JSON.parse(response.body);

  return {
    status: 'ok',
    data,
  };
}

export function buildRequestOptions(sourceOptions: SourceOptions): OptionsOfTextResponseBody {
  const headers: { [key: string]: string } = {
    Accept: 'application/json',
    'X-Api-Key': sourceOptions.apiKey,
  };

  if (sourceOptions.proxy_location) {
    headers['X-Proxy-Location'] = sourceOptions.proxy_location;
  }

  return {
    method: 'GET',
    headers,
  };
}
