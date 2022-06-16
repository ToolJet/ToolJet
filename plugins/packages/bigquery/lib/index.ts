import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { BigQuery } from '@google-cloud/bigquery';
const JSON5 = require('json5');

export default class Bigquery implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const client = await this.getConnection(sourceOptions);
    let result = {};

    // const constructQuery = async (type: string) => {
    //   let query = '';
    //   if (type == 'delete')
    //     query = `DELETE FROM ${queryOptions.tableId} WHERE ${queryOptions.where_field} ='${queryOptions.where_value}';`;
    //   else if (type == 'update')
    //     query = `UPDATE  ${queryOptions.tableId} SET address = 'Canyon 123' WHERE address = 'Valley 345`;
    //   else if (type == 'insert')
    //     query = `INSERT INTO ${queryOptions.tableId} (${queryOptions.columns}) VALUES( ${queryOptions.values})`;
    //   console.log('query ::: ', query);

    //   const [job] = await client.createQueryJob({
    //     ...this.parseJSON(queryOptions.queryOptions),
    //     query: query,
    //   });
    //   const [rows] = await job.getQueryResults(this.parseJSON(queryOptions.queryResultsOptions));
    //   return rows;
    // };

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
          const query = `CREATE VIEW ${queryOptions.datasetId}.${queryOptions.view_name} AS
          SELECT ${queryOptions.columns}
          FROM ${queryOptions.datasetId}.${queryOptions.tableId}
          WHERE ${queryOptions.where_field}${queryOptions.where_operation} ${queryOptions.where_value};`;
          console.log('viewQuery::', query);

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
          const query = `DELETE FROM ${queryOptions.datasetId}.${queryOptions.tableId} WHERE ${queryOptions.where_field}${queryOptions.where_operation}'${queryOptions.where_value}';`;
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
          const query = `UPDATE  ${queryOptions.datasetId}.${queryOptions.tableId} SET ${queryOptions.columns} WHERE ${queryOptions.where_field}${queryOptions.where_operation}'${queryOptions.where_value}'`;
          console.log('updateQuery', query);
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
