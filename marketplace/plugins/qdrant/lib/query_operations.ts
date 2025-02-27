import { QueryOptions } from './types';
import { QdrantClient } from '@qdrant/js-client-rest';

export async function getCollectionInfo(qdrant: QdrantClient, options: QueryOptions): Promise<any> {
  const { collectionName } = options;

  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  return await qdrant.getCollection(collectionName);
}

export async function listCollections(qdrant: QdrantClient, options: QueryOptions): Promise<any> {
  console.log('here');
  const collections = (await qdrant.getCollections()).collections;
  console.log({ collections });
  return collections.map((c) => c.name);
}

export async function getPoints(qdrant: QdrantClient, options: QueryOptions): Promise<any> {
  const { collectionName, ids } = options;

  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  const points = await qdrant.retrieve(collectionName, {
    ids: JSON.parse(ids),
    with_payload: true,
    with_vector: true,
  });

  return points;
}

export async function upsertPoints(qdrant: QdrantClient, options: QueryOptions): Promise<any> {
  const { collectionName, points } = options;

  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  const response = await qdrant.upsert(collectionName, {
    points: JSON.parse(points),
    wait: true,
  });
  return response.status;
}

export async function deletePoints(qdrant: QdrantClient, options: QueryOptions): Promise<any> {
  const { collectionName, ids, filter } = options;

  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  const response = await qdrant.delete(collectionName, {
    filter: filter ? JSON.parse(filter) : undefined,
    points: ids ? JSON.parse(ids) : undefined,
    wait: true,
  });

  return response.status;
}

export async function queryPoints(qdrant: QdrantClient, options: QueryOptions): Promise<any> {
  const { collectionName, query, filter, limit, withPayload, withVectors } = options;

  console.log('OPTIONS ARE ' + JSON.stringify(options));

  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  const response = await qdrant.query(collectionName, {
    query: query ? JSON.parse(query) : null,
    filter: filter ? JSON.parse(filter) : {},
    limit: limit ? JSON.parse(limit) : 10,
    with_payload: withPayload.toLowerCase() === 'true',
    with_vector: withVectors.toLowerCase() == 'true',
  });

  return response.points;
}
