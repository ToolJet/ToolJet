import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, PocketBaseObject, PocketBaseOptions } from './types';
import PocketBase from 'pocketbase';

export default class Pocketbase implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const pb = await this.getConnection(sourceOptions);
    const {collectionId, limit, sort, filterField, filterOperation, filterValue, operation, body, recordId} = queryOptions || {};
    let result:any = {};

    try{
      switch(operation){
        case 'list_records':
          const collectionOption:PocketBaseOptions = {};
          if(sort){
            collectionOption.sort = sort;
          };
          if(filterField && filterOperation && filterValue){
            collectionOption.filter = `${filterField} ${filterOperation} ${filterValue}`;
          };
          if(limit){
            // Fetch a paginated records list
            result = await pb.collection(collectionId).getList(1, limit, collectionOption);
          }else {
            // Fetch all records at once via getFullList
            result = await pb.collection(collectionId).getFullList(collectionOption);
            result.items = result || [];
          };
          break;
        case 'get_record':
          result = await pb.collection(collectionId).getOne(recordId);
          break;
        case 'add_record':
          result = await pb.collection(collectionId).create(body);
          break;
        case 'update_record':
          result = await pb.collection(collectionId).update(recordId, body);
          break;
        case 'delete_record':
          result = await pb.collection(collectionId).delete(recordId);
          break;
        default:
          break;
      };
    }catch(error){
      throw new QueryError('Query could not be completed:- ', error.message, {});
    };
    
    return {
      status: 'ok',
      data: result,
    };
  }

  async getConnection(sourceOptions: SourceOptions, _options?: object): Promise<PocketBase> {
    const { host, email, password } = sourceOptions;
    const pb = new PocketBase(host);
    await pb.admins.authWithPassword(email, password);
    return pb;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const pbClient = await this.getConnection(sourceOptions);
    if (!pbClient) {
      throw new Error('Invalid credentials');
    };
    // fetch a paginated collections list
    const result:PocketBaseObject = await pbClient.collections.getList(1, 10);
    if(result.code && result.code !== 200) {
      throw new Error(result.message);
    };

    return {
      status: 'ok',
    };
  }
}
