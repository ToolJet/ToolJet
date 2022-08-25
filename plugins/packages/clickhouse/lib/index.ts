import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
const { ClickHouse } = require('clickhouse');

export default class Click implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const { query } = queryOptions;

    let result = {};
    const clickhouseClient = await this.getConnection(sourceOptions);

    try {
      result = await clickhouseClient.query(query).toPromise();
      console.log('data is', result);
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }
    return {
      status: 'ok',
      data: result,
    };
  }
  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const { port, host, protocol, database, username, password, format } = sourceOptions;

    const clickhouse = new ClickHouse({
      url: `${protocol}://${host}`,
      port: port,
      debug: false,
      basicAuth: {
        username: `${username ? username : 'default'}`,
        password: `${password ? password : ' '}`,
      },
      isUseGzip: false,
      trimQuery: false,
      usePost: false,
      format: `${format ? format : 'json'}`, // "json" || "csv" || "tsv"
      raw: false,
      config: {
        output_format_json_quote_64bit_integers: 0,
        enable_http_compression: 0,
        database: `${database}`,
      },
    });
    const query = 'SHOW DATABASES';
    clickhouse.query(query).toPromise();

    return {
      status: 'ok',
    };
  }
  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const { port, host, protocol, database, username, password, format } = sourceOptions;

    const clickhouse = new ClickHouse({
      url: `${protocol}://${host}`,
      port: port,
      debug: false,
      basicAuth: {
        username: `${username ? username : 'default'}`,
        password: `${password ? password : ' '}`,
      },
      isUseGzip: false,
      trimQuery: false,
      usePost: false,
      format: `${format ? format : 'json'}`, // "json" || "csv" || "tsv"
      raw: false,
      config: {
        output_format_json_quote_64bit_integers: 0,
        enable_http_compression: 0,
        database: `${database}`,
      },
    });
    return clickhouse;
  }
}
