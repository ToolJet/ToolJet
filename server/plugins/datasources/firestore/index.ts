import { Injectable } from '@nestjs/common';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { addDocument, bulkUpdate, deleteDocument, getDocument, queryCollection, setDocument, updateDocument } from './operations';
const { Firestore } = require('@google-cloud/firestore');

@Injectable()
export default class FirestoreQueryService implements QueryService {

  async run(sourceOptions: any, queryOptions: any): Promise<QueryResult> {

    const gcpKey = JSON.parse(sourceOptions['gcp_key']);

    const firestore = new Firestore({
      projectId: gcpKey['project_id'],
      credentials: {
        "private_key": gcpKey['private_key'],
        "client_email": gcpKey['client_email'],
      }
    });

    const operation = queryOptions.operation; 

    let result = {};

    switch (operation) {
      case 'query_collection':
        result = await queryCollection(firestore, queryOptions.path);
        break;
      case 'get_document':
        result = await getDocument(firestore, queryOptions.path);
        break;  
      case 'set_document':
        result = await setDocument(firestore, queryOptions.path, queryOptions.body);
        break;
      case 'add_document':
        result = await addDocument(firestore, queryOptions.path, queryOptions.body);
        break; 
      case 'update_document':
        result = await updateDocument(firestore, queryOptions.path, queryOptions.body);
        break;  
      case 'delete_document':
        result = await deleteDocument(firestore, queryOptions.path);
        break;  
      case 'bulk_update':
        result = await bulkUpdate(firestore, queryOptions.collection, JSON.parse(queryOptions.records), queryOptions['document_id_key']);
        break;  
    }

    return {
      status: 'ok',
      data: result
    }
  }
}