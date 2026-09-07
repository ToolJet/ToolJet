import axios, { AxiosInstance } from 'axios';
import { SourceOptions, QueryOptions, TavilySearchPayload, TavilyExtractPayload } from './types';

export function createTavilyClient(sourceOptions: SourceOptions): AxiosInstance {
  const baseURL = sourceOptions.base_url || 'https://api.tavily.com';
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
}

function parseList(input?: string[] | string): string[] | undefined {
  if (!input) return undefined;
  if (Array.isArray(input)) return input;
  return input
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export async function search(client: AxiosInstance, sourceOptions: SourceOptions, queryOptions: QueryOptions) {
  if (!queryOptions.query) {
    throw new Error('Query parameter is required for search operation');
  }

  const payload: TavilySearchPayload = {
    api_key: sourceOptions.api_key,
    query: queryOptions.query,
    search_depth: queryOptions.search_depth || 'basic',
    topic: queryOptions.topic || 'general',
    max_results: queryOptions.max_results ? Number(queryOptions.max_results) : 5,
    include_answer: queryOptions.include_answer ?? false,
    include_raw_content: queryOptions.include_raw_content ?? false,
    include_images: queryOptions.include_images ?? false,
    include_domains: parseList(queryOptions.include_domains),
    exclude_domains: parseList(queryOptions.exclude_domains),
  };

  const response = await client.post('/search', payload);
  return response.data;
}

export async function qnaSearch(client: AxiosInstance, sourceOptions: SourceOptions, queryOptions: QueryOptions) {
  if (!queryOptions.query) {
    throw new Error('Query parameter is required for Q&A search operation');
  }

  const payload = {
    api_key: sourceOptions.api_key,
    query: queryOptions.query,
    search_depth: queryOptions.search_depth || 'advanced',
    topic: queryOptions.topic || 'general',
    max_results: queryOptions.max_results ? Number(queryOptions.max_results) : 3,
    include_answer: true,
    include_domains: parseList(queryOptions.include_domains),
    exclude_domains: parseList(queryOptions.exclude_domains),
  };

  const response = await client.post('/search', payload);
  return {
    answer: response.data.answer || '',
    query: response.data.query,
    results: response.data.results || [],
    response_time: response.data.response_time,
  };
}

export async function extract(client: AxiosInstance, sourceOptions: SourceOptions, queryOptions: QueryOptions) {
  const urls = parseList(queryOptions.urls);
  if (!urls || urls.length === 0) {
    throw new Error('At least one URL is required for extract operation');
  }

  const payload: TavilyExtractPayload = {
    api_key: sourceOptions.api_key,
    urls,
  };

  const response = await client.post('/extract', payload);
  return response.data;
}
