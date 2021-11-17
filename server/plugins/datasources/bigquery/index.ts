import { Injectable } from '@nestjs/common';
import { ConnectionTestResult } from 'src/modules/data_sources/connection_test_result.type';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { QueryError } from 'src/modules/data_sources/query.error';
import { BigQuery } from '@google-cloud/bigquery';
import { listDatasets, queryBQ } from './operations';

@Injectable()
export default class BigqueryQueryService implements QueryService {
  async run(sourceOptions: any, queryOptions: any, _dataSourceId: string): Promise<QueryResult> {
    const client = await this.getConnection(sourceOptions);
    const operation = queryOptions.operation;
    let result = {};

    try {

      switch (operation) {
        case 'list_datasets': result = await listDatasets(client, queryOptions)
          break
        case 'query': result = await queryBQ(client, queryOptions);
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
    const client: BigQuery = await this.getConnection(sourceOptions);
    await client.getDatasets();

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: any, _options?: object): Promise<any> {
    const privateKey = JSON.parse(sourceOptions['gcp_key']);
    const storage = new BigQuery({
      projectId: privateKey['project_id'],
      credentials: {
        client_email: privateKey['client_email'],
        private_key: privateKey['private_key'],
      },
    });

    return storage;
  }
}
