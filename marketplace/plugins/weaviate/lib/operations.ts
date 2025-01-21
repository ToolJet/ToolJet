import got from 'got';
import { SourceOptions, QueryOptions } from './types';

export async function getSchema(options: SourceOptions): Promise<any> {
  return await got
    .get(`${options.instanceUrl}/v1/schema`, { headers: { Authorization: `Bearer ${options.apiKey}` } })
    .json();
}

export async function createClass(options: SourceOptions, query: QueryOptions): Promise<any> {
  return await got.post(
    `${options.instanceUrl}/v1/schema`,

    {
      headers: { Authorization: `Bearer ${options.apiKey}` },
      json: { class: query.className, properties: query.properties },
    }
  );
}

export async function listObjects(options: SourceOptions, query: QueryOptions): Promise<any> {
  await got.get(`${options.instanceUrl}/v1/objects?class=${query.className}`, {
    headers: { Authorization: `Bearer ${options.apiKey}` },
  });
}

export async function createObject(options: SourceOptions, query: QueryOptions): Promise<any> {
  return await got.post(
    `${options.instanceUrl}/v1/objects`,

    {
      headers: { Authorization: `Bearer ${options.apiKey}` },
      json: { class: query.className, properties: query.properties },
    }
  );
}
