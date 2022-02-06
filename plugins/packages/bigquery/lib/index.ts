import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { BigQuery, Query } from '@google-cloud/bigquery';

export default class Bigquery implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const client = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (operation) {
        case 'list_datasets':
          const [datasets] = await client.getDatasets(queryOptions.options || {});
          result = datasets;
          break;
        case 'list_tables':
          const [tables] = await client.dataset(queryOptions.datasetId).getTables(queryOptions.options || {});
          result = tables;
          break;
        case 'list_jobs':
          const [jobs] = await client.getJobs(queryOptions.options || {});
          result = jobs;
          break;
        case 'list_routines':
          const [routines] = await client.dataset(queryOptions.datasetId).getRoutines(queryOptions.options || {});
          result = routines;
          break;
        case 'query':
          const options: Query = queryOptions.options || {}
          options.query = queryOptions.query;
          const [job] = await client.createQueryJob(options);
          const [rows] = await job.getQueryResults();
          result = rows;
          break;
      }
    } catch (error) {
      console.log(error);
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async getConnection(sourceOptions: any, _options?: object): Promise<any> {
    const privateKey = JSON.parse(sourceOptions['private_key']);
    const client = new BigQuery({
      projectId: privateKey?.project_id,
      credentials: {
        client_email: privateKey?.client_email,
        private_key: privateKey?.private_key,
      },
    });
  
    return client;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const privateKey: {
      project_id: string;
      client_email: string;
      private_key: string;
    } = JSON.parse(sourceOptions?.private_key);
  
    const client = new BigQuery({
      projectId: privateKey?.project_id,
      credentials: {
        client_email: privateKey?.client_email,
        private_key: privateKey?.private_key,
      },
    });

    if (!client) {
      throw new Error('Invalid credentials');
    }

    await client.getDatasets();

    return {
      status: 'ok',
    };
  }
}
