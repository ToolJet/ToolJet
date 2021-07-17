import { Injectable } from '@nestjs/common';
import { HTTPError } from 'got';
import { QueryError } from 'src/modules/data_sources/query.error';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
const { MongoClient } = require("mongodb");
const got = require('got');

@Injectable()
export default class RestapiQueryService implements QueryService {

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {

    let result = { };
    const method = queryOptions['method'];
    const url = queryOptions['url'];
    const headers = queryOptions['headers'];
    const json = method !== 'get' ? Object.fromEntries(queryOptions['body']) : undefined;
    const searchParams = Object.fromEntries(queryOptions['url_params']);

    try {
      const response = await got(url, { 
        method, 
        headers: Object.fromEntries(headers),
        searchParams,
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
