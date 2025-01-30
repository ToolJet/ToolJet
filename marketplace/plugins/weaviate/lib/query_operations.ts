import weaviate, { WeaviateClient } from 'weaviate-client';

export async function getSchema(client: WeaviateClient, collectionName: string) {
  try {
    const collection = client.collections.get(collectionName);
    const collectionDefinition = await collection.config.get();
    return collectionDefinition.properties;
  } catch (error) {
    console.error('Error fetching schema:', error);
    throw error;
  }
}

export async function listObjects(client: WeaviateClient, collectionName: string) {
  try {
    const collection = client.collections.get(collectionName);
    const res = await collection.query.fetchObjects();
    return res;
  } catch (error) {
    console.log(error);
  }
}

export async function createObject(client: WeaviateClient, collectionName: string, properties: Record<string, any>) {
  try {
    const collection = client.collections.get(collectionName);
    if (!collection) return 'Collection not found';

    const result = await collection.data.insert({
      properties: properties,
      // vectors: Array(1536).fill(0.12345)
      vectors: {
        title: Array(1536).fill(0.12345),
        review_body: Array(1536).fill(0.31313),
        title_country: Array(1536).fill(0.0505),
      },
    });

    return result;
  } catch (error) {
    console.log(error);
  }
}

export async function getObjectById(client: WeaviateClient, collectionName: string, objectId: string) {
  try {
    const collection = client.collections.get(collectionName);
    if (!collection) return 'Collection not exists';

    const result = await collection.query.fetchObjectById(objectId);
    return result;
  } catch (error) {
    console.error('Error fetching object by ID:', error);
    throw error;
  }
}

export async function deleteObjectById(client: WeaviateClient, collectionName: string, id: string) {
  try {
    const collectionToDelete = client.collections.get(collectionName);
    if (!collectionToDelete) return 'Collection does not exists';

    return await collectionToDelete.data.deleteById(id);
  } catch (error) {
    console.error('Error deleting object:', error);
    throw error;
  }
}

export async function getCollection(client: WeaviateClient, collectionName: string, consistency: boolean) {
  try {
    const collection = client.collections.get(collectionName);
    if (!collection) return 'Collection not found';
    if (collection && consistency) {
      collection.withConsistency('QUORUM');
    }
    return collection;
  } catch (error) {
    console.log('Error in getting collection', error);
  }
}

export async function createCollection(client: WeaviateClient, collectionName: string) {
  try {
    const collection = await client.collections.create({
      name: collectionName,
    });
    return collection;
  } catch (error) {
    console.log('Error in getting collection', error);
  }
}
export async function deleteCollection(client: WeaviateClient, collectionName: string) {
  try {
    const collection = client.collections.get(collectionName);
    if (!collection) {
      throw Error(`Collection ${collectionName} does not exist`);
    }
    await client.collections.delete(collectionName);
    return 'Collection deleted successfully';
  } catch (error) {
    console.log('Error in getting collection', error);
  }
}
