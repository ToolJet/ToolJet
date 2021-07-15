import { Injectable } from '@nestjs/common';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { Knex, knex } from 'knex'

@Injectable()
export default class MysqlQueryService implements QueryService {

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {

    const config: Knex.Config = {
      client: 'mysql',
      connection: {
        host : sourceOptions.host,
        user : sourceOptions.username,
        password : sourceOptions.password,
        database : sourceOptions.database,
        port: sourceOptions.port,
      }
    };

    let result = { };

    let query = queryOptions.query;

    const knexInstance = knex(config);

    try {
      result = await knexInstance.raw(query);
    } catch (err) {
      console.log(err);
    }

    return {
      status: 'ok',
      data: result[0]
    }
  }

  async buildBulkUpdateQuery(queryOptions: any): Promise<string> {
    let queryText = '';

    const tableName = queryOptions['table'];
    const primaryKey = queryOptions['primary_key_column'];
    const records = queryOptions['records'];

    for (const record of records) {
      queryText = `${queryText} UPDATE ${tableName} SET`;

      for (const key of Object.keys(record)) {
        if (key !== primaryKey) {
          queryText = ` ${queryText} ${key} = '${record[key]}', `;
        }
      }

      queryText = `${queryText} WHERE ${primaryKey} = ${record[primaryKey]};`;
    }

    return queryText.trim();

  }
}
