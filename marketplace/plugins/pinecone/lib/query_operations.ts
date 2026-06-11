import { QueryOptions } from './types';
import { Pinecone } from '@pinecone-database/pinecone';

export async function getIndexStats(pinecone: Pinecone, options: QueryOptions): Promise<any> {
  const { index } = options;

  if (!index) {
    throw new Error('Index name is required');
  }

  try {
    const indexClient = pinecone.index(index);
    const stats = await indexClient.describeIndexStats();

    return stats;
  } catch (error) {
    console.error('Error fetching index stats:', error);
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

export async function listVectorIds(pinecone: Pinecone, options: QueryOptions): Promise<any> {
  const { index, prefix, limit, paginationToken, namespace } = options;

  if (!index) {
    throw new Error('Index name is required');
  }

  try {
    const indexClient = pinecone.index(index);

    const listOptions = {
      prefix: prefix,
      limit: limit || 10,
      paginationToken: paginationToken,
    };

    const client = namespace ? indexClient.namespace(namespace) : indexClient;

    const vectors = await client.listPaginated(listOptions);

    return vectors;
  } catch (error) {
    console.error('Error listing vector IDs:', error);
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

export async function fetchVectors(pinecone: Pinecone, options: QueryOptions): Promise<any> {
  const { index, ids, namespace } = options;

  if (!index || !ids) {
    throw new Error('Index name and vector IDs are required');
  }

  const vectorIds = typeof ids === 'string' ? JSON.parse(ids) : ids;

  try {
    const indexClient = pinecone.index(index);
    const client = namespace ? await indexClient.namespace(namespace) : indexClient;
    const vectors = await client.fetch(vectorIds);

    return vectors;
  } catch (error) {
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

export async function upsertVectors(pinecone: Pinecone, options: QueryOptions): Promise<any> {
  const { index, vectors, namespace } = options;
  const parsedVectors = typeof vectors === 'string' ? JSON.parse(vectors) : vectors;

  if (!index || !vectors) {
    throw new Error('Index name and vectors are required');
  }

  parsedVectors.forEach((vector) => {
    if (!vector.id || !Array.isArray(vector.values)) {
      throw new Error('Each vector must have an id and a values array');
    }
  });

  try {
    const indexClient = pinecone.index(index);
    const client = namespace ? await indexClient.namespace(namespace) : indexClient;
    const upsertResponse = await client.upsert(parsedVectors);
    if (upsertResponse === undefined) {
      return 'Upsert Successful';
    } else {
      throw new Error('Upsert failed');
    }
  } catch (error) {
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

export async function updateVector(pinecone: Pinecone, options: QueryOptions): Promise<any> {
  const { index, id, values, sparse_vector, metadata, namespace } = options;

  if (!index || !id || (!values && !sparse_vector)) {
    throw new Error('Index name, vector ID, and either values or sparse vector are required');
  }

  const valuesArray = typeof values === 'string' ? JSON.parse(values) : values;

  try {
    const indexClient = pinecone.index(index);
    const client = namespace ? await indexClient.namespace(namespace) : indexClient;
    const updateResponse = await client.update({
      id,
      ...(valuesArray && { values: valuesArray }),
      ...(metadata && { metadata: JSON.parse(metadata) }),
      ...(sparse_vector && { sparseValues: JSON.parse(sparse_vector) }),
    });

    if (updateResponse === undefined) {
      return 'Update Successful';
    } else {
      throw new Error('Update failed');
    }
  } catch (error) {
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

export async function deleteVectors(pinecone: Pinecone, options: QueryOptions): Promise<any> {
  const { index, id, delete_all, namespace, filter } = options;

  if (!index) {
    throw new Error('Index name is required');
  }

  try {
    const indexClient = pinecone.index(index);
    const client = namespace ? await indexClient.namespace(namespace) : indexClient;
    let deleteResponse;
    if (delete_all && delete_all.toLowerCase() === 'true') {
      deleteResponse = await client.deleteAll();
    } else if (filter) {
      deleteResponse = await client.deleteMany({
        filter: JSON.parse(filter),
      });
    } else {
      deleteResponse = await client.deleteMany(JSON.parse(id));
    }

    if (deleteResponse === undefined) {
      return 'Delete Successful';
    } else {
      throw new Error('Delete failed');
    }
  } catch (error) {
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

export async function quertVectors(pinecone: Pinecone, options: QueryOptions): Promise<any> {
  const { index, namespace, top_k, filter, include_values, include_metadata, vectors, sparse_vector } = options;

  if (!index) {
    throw new Error('Index is required');
  }

  const pineconeQueryOptions = {
    topK: Number(top_k),
    vector: JSON.parse(vectors),
    ...(filter && { filter: JSON.parse(filter) }),
    ...(include_values && { includeValues: include_values.toLowerCase() === 'true' }),
    ...(include_metadata && { includeMetadata: include_metadata.toLowerCase() === 'true' }),
    ...(sparse_vector && { sparseVector: JSON.parse(sparse_vector) }),
  };

  try {
    const indexClient = pinecone.index(index);
    const client = namespace ? await indexClient.namespace(namespace) : indexClient;
    const queryResponse = await client.query(pineconeQueryOptions);
    return queryResponse;
  } catch (error) {
    throw new Error(error.message);
  }
}
