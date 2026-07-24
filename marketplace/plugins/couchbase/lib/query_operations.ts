import { QueryOptions } from './types';
import { SourceOptions } from './types';

export async function getDocument(options: QueryOptions, sourceOptions: SourceOptions) {
  const { bucket, scope, collection, document_id } = options;
  const { username, password, data_api_url } = sourceOptions;
  if (!bucket || !scope || !collection || !document_id) {
    throw new Error('Missing required parameters');
  }
  const dapi_url = `${data_api_url}/v1/buckets/${bucket}/scopes/${scope}/collections/${collection}/documents/${document_id}`;
  const response = await fetch(dapi_url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
}

export async function createDocument(options: QueryOptions, sourceOptions: SourceOptions) {
  const { bucket, scope, collection, document_id, document } = options;
  const { username, password, data_api_url } = sourceOptions;
  if (!bucket || !scope || !collection || !document_id) {
    throw new Error('Missing required parameters');
  }

  let parsedDocument;
  if (document) {
    parsedDocument = typeof document === 'string' ? JSON.parse(document) : document;
  }

  const dapi_url = `${data_api_url}/v1/buckets/${bucket}/scopes/${scope}/collections/${collection}/documents/${document_id}`;
  const response = await fetch(dapi_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    },
    body: JSON.stringify(parsedDocument),
  });
  if (!response.ok) {
    throw new Error(`Failed to create document: ${response.statusText}`);
  }
  await response.json().catch(() => (response.status === 201 ? { message: 'Created successfully' } : {}));
  return 'Created successfully';
}

export async function updateDocument(options: QueryOptions, sourceOptions: SourceOptions) {
  const { bucket, scope, collection, document_id, document } = options;
  const { username, password, data_api_url } = sourceOptions;
  if (!bucket || !scope || !collection || !document_id) {
    throw new Error('Missing required parameters');
  }

  let parsedDocument;
  if (document) {
    parsedDocument = typeof document === 'string' ? JSON.parse(document) : document;
  }

  const dapi_url = `${data_api_url}/v1/buckets/${bucket}/scopes/${scope}/collections/${collection}/documents/${document_id}`;
  const response = await fetch(dapi_url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    },
    body: JSON.stringify(parsedDocument),
  });
  if (!response.ok) {
    throw new Error(`Failed to update document: ${response.statusText}`);
  }
  await response.json().catch((error) => {
    if (!response.ok) {
      throw error;
    }
  });
  return 'Updated successfully';
}

export async function deleteDocument(options: QueryOptions, sourceOptions: SourceOptions) {
  const { bucket, scope, collection, document_id } = options;
  const { username, password, data_api_url } = sourceOptions;
  if (!bucket || !scope || !collection || !document_id) {
    throw new Error('Missing required parameters');
  }
  const dapi_url = `${data_api_url}/v1/buckets/${bucket}/scopes/${scope}/collections/${collection}/documents/${document_id}`;
  const response = await fetch(dapi_url, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to delete document: ${response.statusText}`);
  }
  await response.json().catch((error) => {
    if (!response.ok) {
      throw error;
    }
  });
  return 'Deleted successfully';
}

// Query with SQL++ query and parameters
export async function queryDocument(options: QueryOptions, sourceOptions: SourceOptions) {
  const { query, args, query_options } = options;
  const { username, password, data_api_url } = sourceOptions;
  if (!query) {
    throw new Error('Missing required query parameter');
  }

  let parsedArgs;
  if (args) {
    parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
  }

  let parsedQueryOptions;
  if (query_options) {
    parsedQueryOptions = typeof query_options === 'string' ? JSON.parse(query_options) : query_options;
  }

  // Build the query body with statement and all parameters
  const queryBody = {
    statement: query,
    ...(parsedArgs ? parsedArgs : {}),
    ...(parsedQueryOptions ? parsedQueryOptions : {}),
  };

  const dapi_url = `${data_api_url}/_p/query/query/service`;
  const response = await fetch(dapi_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    },
    body: JSON.stringify(queryBody),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to execute query: ${response.statusText}, details: ${errorBody}`);
  }
  const data = await response.json();
  return data;
}

// FTS search with index name and search query
export async function search(options: QueryOptions, sourceOptions: SourceOptions) {
  const { bucket, scope, index_name, search_query } = options;
  const { username, password, data_api_url } = sourceOptions;
  if (!bucket || !index_name || !search_query) {
    throw new Error('Missing required parameters: bucket, index_name, and query are required');
  }

  let parsedSearchQuery;
  if (search_query) {
    parsedSearchQuery = typeof search_query === 'string' ? JSON.parse(search_query) : search_query;
  }

  const dapi_url = `${data_api_url}/_p/fts/api/bucket/${bucket}/scope/${scope}/index/${index_name}/query`;
  const response = await fetch(dapi_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    },
    body: JSON.stringify(parsedSearchQuery),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to execute search: ${response.statusText}, details: ${errorBody}`);
  }
  const data = await response.json();
  return data;
}
