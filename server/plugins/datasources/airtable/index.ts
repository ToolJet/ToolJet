import { Injectable } from '@nestjs/common';
import { QueryError } from 'src/modules/data_sources/query.error';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
const got = require('got');

@Injectable()
export default class AirtableQueryService implements QueryService {

  authHeader(token: string): object {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {

    let result = { };
    let response = null;
    const operation = queryOptions.operation;
    const baseId = queryOptions['base_id'];
    const tableName = queryOptions['table_name'];
    const accessToken = sourceOptions['api_key'];

    try {
      switch (operation) {
        case 'list_records':
          const pageSize = queryOptions['page_size'];
          const offset = queryOptions['offset'];

          response = await got(`https://api.airtable.com/v0/${baseId}/${tableName}/?pageSize=${pageSize || ''}&offset=${offset || ''}`, { 
            method: 'get', 
            headers: this.authHeader(accessToken)
          });

          result = JSON.parse(response.body);
          break;

        case 'retrieve_record':
          const recordId = queryOptions['record_id'];

          response = await got(`https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`, { 
            headers: this.authHeader(accessToken)
          });

          result = JSON.parse(response.body);
          break;

          case 'update_record':
            
          response = await got(`https://api.airtable.com/v0/${baseId}/${tableName}`, { 
            method: 'patch',   
            headers: this.authHeader(accessToken),
            json: {
              "records": queryOptions.option_body
            }
          });

          result = JSON.parse(response.body);

          break;
          case 'delete_record':
            const _recordId = queryOptions['record_id'];  
  
            response = await got(`https://api.airtable.com/v0/${baseId}/${tableName}/${_recordId}`, { 
              method: 'delete',   
              headers: this.authHeader(accessToken)
            });
            
            result = JSON.parse(response.body);
            break;
      }
    } catch (error) {
      console.log(error.response);
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result
    }
  }

}
