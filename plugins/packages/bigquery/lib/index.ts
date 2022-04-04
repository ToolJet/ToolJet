import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { BigQuery } from '@google-cloud/bigquery';
const JSON5 = require('json5');

export default class Bigquery implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const client = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (operation) {
        case 'list_datasets': {
          const [datasets] = await client.getDatasets(this.parseJSON(queryOptions.options));
          result = datasets;
          break;
        }
        case 'list_tables': {
          const [tables] = await client.dataset(queryOptions.datasetId).getTables(this.parseJSON(queryOptions.options));
          result = tables;
          break;
        }
        case 'query': {
          const [job] = await client.createQueryJob({
            ...this.parseJSON(queryOptions.queryOptions),
            query: queryOptions.query,
          });
          const [rows] = await job.getQueryResults(this.parseJSON(queryOptions.queryResultsOptions));
          result = rows;
          break;
        }
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
    const privateKey = this.getPrivateKey(sourceOptions?.private_key);

    return new BigQuery({
      projectId: privateKey?.project_id,
      credentials: {
        client_email: privateKey?.client_email,
        private_key: privateKey?.private_key,
      },
    });
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const privateKey = this.getPrivateKey(sourceOptions?.private_key);

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

  private parseJSON(json?: string): object {
    if (!json) return {};

    return JSON5.parse(json);
  }

  private getPrivateKey(configs?: string): {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  } {
    return this.parseJSON(configs);
  }
}
