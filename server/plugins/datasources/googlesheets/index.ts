import { Injectable } from '@nestjs/common';
import { QueryError } from 'src/modules/data_sources/query.error';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { readData, appendData, deleteData, batchUpdateToSheet } from './operations';
const got = require('got');

@Injectable()
export default class GooglesheetsQueryService implements QueryService {
  authUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const tooljetHost = process.env.TOOLJET_HOST;
    return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${tooljetHost}/oauth2/authorize`;
  }

  async accessDetailsFrom(authCode: string): Promise<object> {
    const accessTokenUrl = 'https://oauth2.googleapis.com/token';
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const tooljetHost = process.env.TOOLJET_HOST;
    const redirectUri = `${tooljetHost}/oauth2/authorize`;
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

  authHeader(token: string): object {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
    let result = {};
    let response = null;
    const operation = queryOptions.operation;
    const spreadsheetId = queryOptions['spreadsheet_id'];
    const spreadsheetRange = queryOptions['spreadsheet_range'] ? queryOptions['spreadsheet_range'] : 'A1:Z500';
    const accessToken = sourceOptions['access_token'];
    const queryOptionFilter = { key: queryOptions['filterOption'], value: queryOptions['filterData'] };
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
          result = await readData(spreadsheetId, spreadsheetRange, queryOptions['sheet'], this.authHeader(accessToken));
          break;

        case 'append':
          result = await appendData(
            spreadsheetId,
            queryOptions['sheet'],
            queryOptions['rows'],
            this.authHeader(accessToken)
          );
          break;

        case 'update':
          result = await batchUpdateToSheet(
            spreadsheetId,
            queryOptions['body'],
            queryOptionFilter,
            this.authHeader(accessToken)
          );
          break;

        case 'delete_row':
          result = await deleteData(
            spreadsheetId,
            queryOptions['sheet'],
            queryOptions['row_index'],
            this.authHeader(accessToken)
          );
          break;
      }
    } catch (error) {
      console.log(error.response);
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }
}
