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
          const [datasets] = await client.getDatasets();
          result = datasets;
          break;
        }

        case 'list_tables': {
          const [tables] = await client.dataset(queryOptions.datasetId).getTables();
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
          const query = `CREATE VIEW ${queryOptions.datasetId}.${queryOptions.view_name} AS
          SELECT ${queryOptions.viewcolumns}
          FROM ${queryOptions.datasetId}.${queryOptions.tableId}
          WHERE ${queryOptions.condition};`;

          const [job] = await client.createQueryJob({
            ...this.parseJSON(queryOptions.queryOptions),
            query: query,
          });
          const [rows] = await job.getQueryResults(this.parseJSON(queryOptions.queryResultsOptions));
          result = rows;
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
          const query = `DELETE FROM ${queryOptions.datasetId}.${queryOptions.tableId} ${
            queryOptions.condition ? `WHERE ${queryOptions.condition}` : 'WHERE TRUE'
          }`;
          const [job] = await client.createQueryJob({
            ...this.parseJSON(queryOptions.queryOptions),
            query: query,
          });
          const [rows] = await job.getQueryResults(this.parseJSON(queryOptions.queryResultsOptions));
          result = rows;
          break;
        }

        case 'insert_record': {
          const rows = await client
            .dataset(queryOptions.datasetId)
            .table(queryOptions.tableId)
            .insert(this.parseJSON(queryOptions.rows));
          result = rows;
          break;
        }

        case 'update_record': {
          let columString = '';
          columString = await this.columnBuilder(queryOptions);
          const query = `UPDATE  ${queryOptions.datasetId}.${queryOptions.tableId} SET ${columString}  ${
            queryOptions.condition ? `WHERE ${queryOptions.condition}` : 'WHERE TRUE'
          }`;

          const [job] = await client.createQueryJob({
            ...this.parseJSON(queryOptions.queryOptions),
            query: query,
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
  async columnBuilder(queryOptions: any): Promise<string> {
    const columString = [];
    const columns = queryOptions.columns;
    for (const [key, value] of Object.entries(columns)) {
      const primaryKeyValue = typeof value === 'string' ? `'${value}'` : value;
      columString.push(`${key}=${primaryKeyValue}`);
    }
    return columString.join(',');
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
