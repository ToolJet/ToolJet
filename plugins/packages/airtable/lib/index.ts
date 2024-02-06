import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import got, { Headers } from 'got';

export default class AirtableQueryService implements QueryService {
  authHeader(token: string): Headers {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    let result = {};
    let apiToken = '';
    let response = null;
    const operation = queryOptions.operation;
    const baseId = queryOptions.base_id;
    const tableName = queryOptions.table_name;

    // Below condition for API Key is kept for Backward compatibility and needs migration to be removed later on.
    if (sourceOptions.api_key) apiToken = sourceOptions.api_key;
    if (sourceOptions.personal_access_token) apiToken = sourceOptions.personal_access_token;

    try {
      switch (operation) {
        case 'list_records': {
          const pageSize = queryOptions.page_size || '';
          const offset = queryOptions.offset || '';

          response = await got(
            `https://api.airtable.com/v0/${baseId}/${tableName}/?pageSize=${pageSize}&offset=${offset}`,
            {
              method: 'get',
              headers: this.authHeader(apiToken),
            }
          );

          result = JSON.parse(response.body);
          break;
        }

        case 'retrieve_record': {
          const recordId = queryOptions.record_id;

          response = await got(`https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`, {
            headers: this.authHeader(apiToken),
          });

          result = JSON.parse(response.body);
          break;
        }

        case 'create_record': {
          response = await got(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
            method: 'post',
            headers: this.authHeader(apiToken),
            json: {
              records: JSON.parse(queryOptions.body),
            },
          });

          result = JSON.parse(response.body);

          break;
        }

        case 'update_record': {
          response = await got(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
            method: 'patch',
            headers: this.authHeader(apiToken),
            json: {
              records: [
                {
                  id: queryOptions.record_id,
                  fields: JSON.parse(queryOptions.body),
                },
              ],
            },
          });

          result = JSON.parse(response.body);

          break;
        }

        case 'delete_record': {
          const _recordId = queryOptions.record_id;

          response = await got(`https://api.airtable.com/v0/${baseId}/${tableName}/${_recordId}`, {
            method: 'delete',
            headers: this.authHeader(apiToken),
          });
          result = JSON.parse(response.body);

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
}
