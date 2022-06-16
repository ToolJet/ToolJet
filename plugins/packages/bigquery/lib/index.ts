import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { BigQuery } from '@google-cloud/bigquery';
const JSON5 = require('json5');

export default class Bigquery implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const client = await this.getConnection(sourceOptions);
    let result = {};

    const constructDeleteQuery = async (table_name, condition) => {
      const delQuery = `DELETE FROM ${table_name} WHERE ${condition};`;
      const [job] = await client.createQueryJob({
        ...this.parseJSON(queryOptions.queryOptions),
        query: delQuery,
      });
      const [rows] = await job.getQueryResults(this.parseJSON(queryOptions.queryResultsOptions));
      return rows;
    };

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
        case 'create_table': {
          const [table] = await client
            .dataset(queryOptions.datasetId)
            .createTable(queryOptions.tableId, this.parseJSON(queryOptions.options));
          result = table;
          break;
        }
        case 'delete_table': {
          result = await client.dataset(queryOptions.datasetId).table(queryOptions.tableId).delete();
          break;
        }
        case 'create_view': {
          const [view] = await client
            .dataset(queryOptions.datasetId)
            .createTable(queryOptions.tableId, this.parseJSON(queryOptions.options));

          result = view;
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
        case 'delete_record': {
          const rows = constructDeleteQuery(queryOptions.tableId, queryOptions.condition);
          result = rows;
          break;
        }
        case 'insert_record': {
          const [datasets] = await client
            .dataset(queryOptions.datasetId)
            .table(queryOptions.tableId)
            .insert(this.parseJSON(queryOptions.rows));
          result = datasets;
          break;
        }
        case 'update_record': {
          const [datasets] = await client
            .dataset(queryOptions.datasetId)
            .table(queryOptions.tableId)
            .insert(this.parseJSON(queryOptions.rows));
          result = datasets;
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
