import { Injectable } from '@nestjs/common';
import { HTTPError } from 'got';
import { QueryError } from 'src/modules/data_sources/query.error';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
const got = require('got');

@Injectable()
export default class RestapiQueryService implements QueryService {

  /* Headers of the source will be overridden by headers of the query */
  headers(sourceOptions: any, queryOptions: any, hasDataSource: boolean): object {
    if(!hasDataSource) return Object.fromEntries(queryOptions.headers || []);

    const headerData = (queryOptions.headers || []).concat(sourceOptions.headers || []);

    let headers = Object.fromEntries(headerData);
    Object.keys(headers).forEach(key => headers[key] === '' ? delete headers[key] : {});

    return headers;
  }

  /* Body params of the source will be overridden by body params of the query */
  body(sourceOptions: any, queryOptions: any, hasDataSource: boolean): object {
    if(!hasDataSource) return Object.fromEntries(queryOptions.body || []);

    const bodyParams = (queryOptions.body || []).concat(sourceOptions.body || []);
    return Object.fromEntries(bodyParams);
  }

  /* Search params of the source will be overridden by Search params of the query */
  searchParams(sourceOptions: any, queryOptions: any, hasDataSource: boolean): object {
    if(!hasDataSource) return Object.fromEntries(queryOptions.url_params || []);

    const urlParams = (queryOptions.url_params || []).concat(sourceOptions.url_params || []);
    return Object.fromEntries(urlParams);
  }

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {

    /* REST API queries can be adhoc or associated with a REST API datasource */
    const hasDataSource = dataSourceId !== undefined;
    let result = { };

    /* Prefixing the base url of datasouce if datasource exists */
    const url = hasDataSource ? `${sourceOptions.url}${queryOptions.url}` : queryOptions.url;

    const method = queryOptions['method'];
    const json = method !== 'get' ? this.body(sourceOptions, queryOptions, hasDataSource) : undefined;

    try {
      const response = await got(url, { 
        method, 
        headers: this.headers(sourceOptions, queryOptions, hasDataSource),
        searchParams: this.searchParams(sourceOptions, queryOptions, hasDataSource),
        json
      });
      result = JSON.parse(response.body);
    } catch (error) {
      console.log(error);

      if(error instanceof HTTPError) {
        result = {
          code: error.code
        }
      }
      throw new QueryError('Query could not be completed', error.message, result);
    }

    return {
      status: 'ok',
      data: result
    }
  }
}
