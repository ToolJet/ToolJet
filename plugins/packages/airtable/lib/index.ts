import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { sanitizeSortPairs } from '@tooljet-plugins/common';
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
          const pageSize = queryOptions.page_size || null;
          const offset = queryOptions.offset || null;
          const fields = queryOptions.fields || null;
          const filterFormula = queryOptions.filter_by_formula || null;
          const timezone = queryOptions.timezone || null;
          const user_locale = queryOptions.user_locale || null;
          const cell_format = queryOptions.cell_format || null;
          const view = queryOptions.view || null;
          const sort = queryOptions.sort || null;

          const requestBody: any = {};

          if (fields) {
            try {
              const parsedFields = JSON.parse(fields);
              requestBody.fields = parsedFields;
            } catch (error) {
              throw new Error('Invalid JSON format for fields');
            }
          }
          if (filterFormula) {
            requestBody.filterByFormula = filterFormula;
          }
          if (pageSize) {
            requestBody.pageSize = Number(pageSize);
          }
          if (offset) {
            requestBody.offset = offset;
          }
          if (timezone) {
            requestBody.timeZone = timezone.trim();
          }
          if (user_locale) {
            requestBody.userLocale = user_locale.trim();
          }
          if (cell_format) {
            requestBody.cellFormat = cell_format.trim();
          }
          if (view) {
            requestBody.view = view.trim();
          }
          if (sort) {
            const sanitizedSort = sanitizeSortPairs(sort);

            const formattedSort = sanitizedSort.map(([field, direction]) => ({
              field,
              direction,
            }));
            requestBody.sort = formattedSort;
          }
          response = await got(`https://api.airtable.com/v0/${baseId}/${tableName}/listRecords`, {
            method: 'post',
            headers: this.authHeader(apiToken),
            json: requestBody,
          });

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
      let errorMessage = 'Query could not be completed';
      let errorDetails: any = {};

      if (error.response) {
        try {
          const errorResponse =
            typeof error.response.body === 'string' ? JSON.parse(error.response.body) : error.response.body;

          errorMessage = errorResponse.message || errorResponse.error || errorMessage;
          if (typeof errorResponse.error === 'string') {
            errorDetails.type = errorResponse.error;
          } else {
            errorDetails = errorResponse.error;
          }
        } catch (parseError) {
          console.error('Failed to parse Airtable error response:', parseError);
        }
      }

      throw new QueryError(errorMessage, error.message, errorDetails);
    }

    return {
      status: 'ok',
      data: result,
    };
  }
}
