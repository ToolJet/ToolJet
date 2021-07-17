import { Injectable } from '@nestjs/common';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
const { Pool } = require('pg');

@Injectable()
export default class PostgresqlQueryService implements QueryService {

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {

    const pool = await this.getConnection(sourceOptions);

    let result = {
      rows: []
    };
    let query = '';

    if(queryOptions.mode === 'gui') {
      if(queryOptions.operation === 'bulk_update_pkey') { 
        query = await this.buildBulkUpdateQuery(queryOptions);
      }
    } else { 
      query = queryOptions.query;
    }

    result = await pool.query(queryOptions.query);

    return {
      status: 'ok',
      data: result.rows
    }
  }

  async getConnection(sourceOptions: any): Promise<any> { 
    return new Pool({
      user: sourceOptions.username,
      host: sourceOptions.host,
      database: sourceOptions.database,
      password: sourceOptions.password,
      port: sourceOptions.port,
    });
  }

  async buildBulkUpdateQuery(queryOptions: any): Promise<string> {
    let queryText = '';

    const tableName = queryOptions['table'];
    const primaryKey = queryOptions['primary_key_column'];
    const records = queryOptions['records'];

    for( const record of records ) {
      queryText = `${queryText} UPDATE ${tableName} SET`;

      for(const key of Object.keys(record)) {
        if(key !== primaryKey) {
          queryText = ` ${queryText} ${key} = '${record[key]}', `;
        }
      }

      queryText = `${queryText} WHERE ${primaryKey} = ${record[primaryKey]};`;
    }

    return queryText.trim();

  }
}
