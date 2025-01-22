import { QueryService, QueryResult, ConnectionTestResult, QueryError } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import { getSchema, listObjects, createObject, getObjectById, deleteObjectById } from './query_operations';
import weaviate, { WeaviateClient } from 'weaviate-client';
export default class Weaviate implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const client  = await this.getConnection(sourceOptions)
    let result = {};
    try {
      console.log('tjdb index',{queryOptions});
      
      switch (queryOptions.operation) {
        case Operation.get_schema:
          result = await getSchema(client,queryOptions.collectionName);
          break;
        case Operation.list_objects:
          console.log('tjdb list object switch');
          
          result = await listObjects(client, queryOptions.collectionName);
          break;
        case Operation.create_object:
          result = await createObject(client,queryOptions.collectionName,queryOptions.properties);
          break;
        case Operation.get_object_by_id:
          result = await getObjectById(client,queryOptions.collectionName,queryOptions.objectId);
          break;
        case Operation.delete_object_by_id:
          result = await deleteObjectById(client,queryOptions.collectionName,queryOptions.objectId);
          break;
        default:
          throw new QueryError('Invalid operation', 'Operation not supported', {});
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error?.message, {});
    }
    
    return { status: 'ok', data: result };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
     const client =  await this.getConnection(sourceOptions);
    await client.collections.listAll();
    return { status: 'ok' };

    } catch (error) {
      throw new QueryError('Connection failed', error?.message, {});
    }
  }

  async getConnection(sourceOptions: SourceOptions) {

    const weaviateURL = sourceOptions.instanceUrl as string
    const weaviateKey = sourceOptions.apiKey as string
    const client: WeaviateClient = await weaviate.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate.ApiKey(weaviateKey),
      }
    )

    return client;
    
  }
}

