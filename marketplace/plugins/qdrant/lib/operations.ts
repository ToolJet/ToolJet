import { QueryOptions } from './types';
import { QdrantClient } from '@qdrant/js-client-rest';

export async function getCollectionInfo(qdrant: QdrantClient, options: QueryOptions): Promise<any> {
  const { collectionName } = options;

  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  try {
    return await qdrant.getCollection(collectionName);
  } catch (error) {
    console.error('Error fetching collection info:', error);
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

export async function listCollections(qdrant: QdrantClient): Promise<any> {
  try {
    const collections = (await qdrant.getCollections()).collections;
    return collections.map((c) => c.name);
  } catch (error) {
    console.error('Error listing collections:', error);
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

export async function getPoints(qdrant: QdrantClient, options: QueryOptions): Promise<any> {
  const { collectionName, ids } = options;

  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  try {
    const points = await qdrant.retrieve(collectionName, {
      ids: JSON.parse(ids),
      with_payload: true,
      with_vector: true,
    });

    return points;
  } catch (error) {
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

export async function upsertPoints(qdrant: QdrantClient, options: QueryOptions): Promise<any> {
  const { collectionName, points } = options;

  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  try {
    const response = await qdrant.upsert(collectionName, {
      points: JSON.parse(points),
    });
    return response.status;
  } catch (error) {
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

export async function deletePoints(qdrant: QdrantClient, options: QueryOptions): Promise<any> {
  const { collectionName, ids, filter } = options;

  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  try {
    const response = await qdrant.delete(collectionName, {
      filter: filter ? JSON.parse(filter) : undefined,
      points: ids ? JSON.parse(ids) : undefined,
    });

    return response.status;
  } catch (error) {
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}

export async function queryPoints(qdrant: QdrantClient, options: QueryOptions): Promise<any> {
  const { collectionName, query, filter, limit, withPayload, withVectors } = options;

  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  try {
    const response = await qdrant.query(collectionName, {
      query: JSON.parse(query),
      filter: JSON.parse(filter),
      limit: JSON.parse(limit),
      with_payload: withPayload.toLowerCase() === 'true',
      with_vector: withVectors.toLowerCase() === 'true',
    });

    return response.points;
  } catch (error) {
    throw new Error(error?.message);
  }
}
