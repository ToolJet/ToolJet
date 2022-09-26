import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
const { ClickHouse } = require('clickhouse');
const JSON5 = require('json5');

export default class Click implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const { query, operation, fields, tablename } = queryOptions;
    let result = {};
    const clickhouseClient = await this.getConnection(sourceOptions);
    try {
      switch (operation) {
        case 'sql': {
          result = await clickhouseClient.query(query).toPromise();
          break;
        }
        case 'insert': {
          result = await clickhouseClient
            .insert(`INSERT INTO ${tablename} (${fields.join(',')})`, this.parseJSON(query))
            .toPromise();
          break;
        }
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }
    return {
      status: 'ok',
      data: result,
    };
  }
  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const clickhouse = await this.getConnection(sourceOptions);
    const query = 'SHOW DATABASES';
    if (!clickhouse) {
      throw new Error('Invalid credentials');
    }
    await clickhouse.query(query).toPromise();
    return {
      status: 'ok',
    };
  }
  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const { port, host, protocol, database, username, password, usePost, trimQuery, isUseGzip, debug, raw } =
      sourceOptions;
    const clickhouse = new ClickHouse({
      url: `${protocol}://${host}`,
      port: port || 8123,
      debug: debug || false,
      basicAuth:
        username?.length > 0 && password?.length > 0
          ? { username: username || 'default', password: password || ' ' }
          : 'null',
      isUseGzip: isUseGzip || false,
      trimQuery: trimQuery || false,
      usePost: usePost || false,
      format: 'json', // "json" || "csv" || "tsv"
      raw: raw || false,
      config: {
        output_format_json_quote_64bit_integers: 0,
        enable_http_compression: 0,
        ...(database?.length > 0 && { database: database }),
      },
    });
    return clickhouse;
  }

  private parseJSON(json?: string): object {
    if (!json) return {};

    return JSON5.parse(json);
  }
}
