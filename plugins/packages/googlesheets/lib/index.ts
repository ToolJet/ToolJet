import { QueryError, QueryResult, QueryService, OAuthUnauthorizedClientError } from '@tooljet-plugins/common';
import { readData, appendData, deleteData, batchUpdateToSheet } from './operations';
import got, { Headers } from 'got';
import { SourceOptions, QueryOptions } from './types';

export default class GooglesheetsQueryService implements QueryService {
  authUrl(): string {
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw Error('You need to define Google OAuth environment variables');
    }

    return (
      'https://accounts.google.com/o/oauth2/v2/auth' +
      `?response_type=code&client_id=${clientId}` +
      `&redirect_uri=${fullUrl}oauth2/authorize`
    );
  }

  async accessDetailsFrom(authCode: string): Promise<object> {
    const accessTokenUrl = 'https://oauth2.googleapis.com/token';
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;
    const grantType = 'authorization_code';
    const customParams = { prompt: 'consent', access_type: 'offline' };

    const data = {
      code: authCode,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType,
      redirect_uri: redirectUri,
      ...customParams,
    };

    const authDetails = [];

    try {
      const response = await got(accessTokenUrl, {
        method: 'post',
        json: data,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = JSON.parse(response.body);

      if (response.statusCode !== 200) {
        throw Error('could not connect to Googlesheets');
      }

      if (result['access_token']) {
        authDetails.push(['access_token', result['access_token']]);
      }

      if (result['refresh_token']) {
        authDetails.push(['refresh_token', result['refresh_token']]);
      }
    } catch (error) {
      console.log(error.response.body);
      throw Error('could not connect to Googlesheets');
    }

    return authDetails;
  }

  authHeader(token: string): Headers {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result = {};
    let response = null;
    const operation = queryOptions.operation;
    const spreadsheetId = queryOptions.spreadsheet_id;
    const spreadsheetRange = queryOptions.spreadsheet_range ? queryOptions.spreadsheet_range : 'A1:Z500';
    const accessToken = sourceOptions['access_token'];
    const queryOptionFilter = {
      key: queryOptions.where_field,
      value: queryOptions.where_value,
    };

    try {
      switch (operation) {
        case 'info':
          response = await got(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
            method: 'get',
            headers: this.authHeader(accessToken),
          });

          result = JSON.parse(response.body);
          break;

        case 'read':
          result = await readData(spreadsheetId, spreadsheetRange, queryOptions.sheet, this.authHeader(accessToken));
          break;

        case 'append':
          result = await appendData(spreadsheetId, queryOptions.sheet, queryOptions.rows, this.authHeader(accessToken));
          break;

        case 'update':
          result = await batchUpdateToSheet(
            spreadsheetId,
            spreadsheetRange,
            queryOptions.sheet,
            queryOptions.body,
            queryOptionFilter,
            queryOptions.where_operation,
            this.authHeader(accessToken)
          );
          break;

        case 'delete_row':
          result = await deleteData(
            spreadsheetId,
            queryOptions.sheet,
            queryOptions.row_index,
            this.authHeader(accessToken)
          );
          break;
      }
    } catch (error) {
      console.error({ statusCode: error?.response?.statusCode, message: error?.response?.body });

      if (error?.response?.statusCode === 401) {
        throw new OAuthUnauthorizedClientError('Query could not be completed', error.message, { ...error });
      }
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async refreshToken(sourceOptions) {
    if (!sourceOptions['refresh_token']) {
      throw new QueryError('Query could not be completed', 'Refresh token empty', {});
    }
    const accessTokenUrl = 'https://oauth2.googleapis.com/token';
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const grantType = 'refresh_token';

    const data = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType,
      refresh_token: sourceOptions['refresh_token'],
    };

    const accessTokenDetails = {};

    try {
      const response = await got(accessTokenUrl, {
        method: 'post',
        json: data,
        headers: { 'Content-Type': 'application/json' },
      });
      const result = JSON.parse(response.body);

      if (!(response.statusCode >= 200 || response.statusCode < 300)) {
        throw new QueryError(
          'could not connect to Googlesheets',
          JSON.stringify({ statusCode: response?.statusCode, message: response?.body }),
          {}
        );
      }

      if (result['access_token']) {
        accessTokenDetails['access_token'] = result['access_token'];
        accessTokenDetails['refresh_token'] = result['refresh_token'];
      } else {
        throw new QueryError(
          'access_token not found in the response',
          {},
          {
            responseObject: {
              statusCode: response.statusCode,
              responseBody: response.body,
            },
            responseHeaders: response.headers,
          }
        );
      }
    } catch (error) {
      console.error(
        `Error while REST API refresh token call. Status code : ${error.response?.statusCode}, Message : ${error.response?.body}`
      );
      throw new QueryError(
        'could not connect to Googlesheets',
        JSON.stringify({ statusCode: error.response?.statusCode, message: error.response?.body }),
        {}
      );
    }
    return accessTokenDetails;
  }
}
