import { Injectable } from '@nestjs/common';
import { parseJson } from 'src/helpers/utils.helper';
import { ConnectionTestResult } from 'src/modules/data_sources/connection_test_result.type';
import { QueryError } from 'src/modules/data_sources/query.error';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import {
  addDocument,
  bulkUpdate,
  deleteDocument,
  getDocument,
  queryCollection,
  setDocument,
  updateDocument,
} from './operations';
const { Firestore } = require('@google-cloud/firestore');

@Injectable()
export default class FirestoreQueryService implements QueryService {
  async run(sourceOptions: any, queryOptions: any): Promise<QueryResult> {
    const firestore = await this.getConnection(sourceOptions);
    const operation = queryOptions.operation;
    let result = {};

    try {
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
          result = await bulkUpdate(
            firestore,
            queryOptions.collection,
            JSON.parse(queryOptions.records),
            queryOptions['document_id_key']
          );
          break;
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: object): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions);
    await getDocument(client, 'test/test');

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: any): Promise<any> {
    const gcpKey = parseJson(sourceOptions['gcp_key'], 'GCP key could not be parsed as a valid JSON object');

    const firestore = new Firestore({
      projectId: gcpKey['project_id'],
      credentials: {
        private_key: gcpKey['private_key'],
        client_email: gcpKey['client_email'],
      },
    });

    return firestore;
  }
}
