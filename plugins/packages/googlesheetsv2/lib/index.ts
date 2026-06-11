import {
  QueryError,
  QueryResult,
  QueryService,
  OAuthUnauthorizedClientError,
  isEmpty,
  App,
  User,
  ConnectionTestResult,
  validateAndSetRequestOptionsBasedOnAuthType,
  getCurrentToken,
} from '@tooljet-plugins/common';
import {
  readData,
  appendData,
  deleteData,
  batchUpdateToSheet,
  createSpreadSheet,
  listAllSheets,
  deleteFromSpreadsheetByFilter,
  bulkUpdateByPrimaryKey,
  copySpreadsheetData,
  listAllSpreadsheets,
  deleteByRange,
  updateSpreadsheet,
} from './operations';
import got, { Headers, OptionsOfTextResponseBody } from 'got';
import { SourceOptions, QueryOptions, ConvertedFormat } from './types';
import { google } from 'googleapis';

export default class Googlesheetsv2QueryService implements QueryService {
  authUrl(source_options: SourceOptions): string {
    const getSourceOptionValue = (key: string) => {
      const option = Array.isArray(source_options)
        ? source_options.find((item) => item.key === key)
        : source_options[key];

      if (Array.isArray(source_options)) {
        return option?.value || '';
      } else {
        return option?.value || option || '';
      }
    };
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const oauth_type = getSourceOptionValue('oauth_type');
    const userScopes =
      getSourceOptionValue('access_type') === 'write'
        ? 'https://www.googleapis.com/auth/spreadsheets'
        : 'https://www.googleapis.com/auth/spreadsheets.readonly';

    const clientId = oauth_type === 'tooljet_app' ? process.env.GOOGLE_CLIENT_ID : getSourceOptionValue('client_id');

    const alwaysScope = 'https://www.googleapis.com/auth/drive.metadata.readonly';

    const allScopes = new Set(`${userScopes} ${alwaysScope}`.trim().split(/\s+/));

    const scope = Array.from(allScopes).join(' ');
    if (!clientId) {
      throw Error('You need to define Google OAuth environment variables');
    }

    return (
      'https://accounts.google.com/o/oauth2/v2/auth' +
      `?response_type=code&client_id=${clientId}` +
      `&redirect_uri=${fullUrl}oauth2/authorize` +
      `&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`
    );
  }

  async accessDetailsFrom(authCode: string, source_options: any, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }

    const getSourceOptionValue = (key: string) => {
      const option = Array.isArray(source_options)
        ? source_options.find((item) => item.key === key)
        : source_options[key];

      if (Array.isArray(source_options)) {
        return option?.value || '';
      } else {
        return option?.value || option || '';
      }
    };

    let clientId = '';
    let clientSecret = '';
    const oauth_type = getSourceOptionValue('oauth_type');

    if (oauth_type === 'tooljet_app') {
      clientId = process.env.GOOGLE_CLIENT_ID;
      clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    } else {
      clientId = getSourceOptionValue('client_id');
      clientSecret = getSourceOptionValue('client_secret');
    }

    if (!clientId || !clientSecret) {
      throw new Error(`Missing OAuth credentials. ClientId: ${!!clientId}, ClientSecret: ${!!clientSecret}`);
    }

    const accessTokenUrl = 'https://oauth2.googleapis.com/token';
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
      console.log('OAuth error response:', error.response?.body);
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

  private constructSourceOptions(sourceOptions) {
    const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

    const userScopes =
      sourceOptions?.access_type === 'write'
        ? 'https://www.googleapis.com/auth/spreadsheets'
        : 'https://www.googleapis.com/auth/spreadsheets.readonly';

    const alwaysScopes = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
    const allScopesSet = new Set(`${userScopes} ${alwaysScopes.join(' ')}`.trim().split(/\s+/));
    const finalScopes = Array.from(allScopesSet).join(' ');

    const addSourceOptions = {
      url: baseUrl,
      auth_url: authUrl,
      add_token_to: 'header',
      header_prefix: 'Bearer ',
      access_token_url: 'https://oauth2.googleapis.com/token',
      audience: '',
      username: '',
      password: '',
      bearer_token: '',
      client_auth: 'header',
      headers: [
        ['', ''],
        ['tj-x-forwarded-for', '::1'],
      ],
      custom_query_params: [
        ['access_type', 'offline'],
        ['prompt', 'consent'],
      ],
      custom_auth_params: [['', '']],
      access_token_custom_headers: [['', '']],
      ssl_certificate: 'none',
      retry_network_errors: true,
      scopes: finalScopes,
    };

    const newSourceOptions = {
      ...sourceOptions,
      ...addSourceOptions,
    };

    return newSourceOptions;
  }

  private convertQueryOptions(queryOptions: any = {}, customHeaders?: Record<string, string>): any {
    const { operation = 'get', params = {} } = queryOptions;

    const result: ConvertedFormat = {
      method: (operation || 'get').toLowerCase(),
      headers: customHeaders || {},
    };

    if (params.query && Object.keys(params.query).length > 0) {
      const urlParams = new URLSearchParams();
      Object.entries(params.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => urlParams.append(key, String(v)));
          } else {
            urlParams.append(key, String(value));
          }
        }
      });
      result.searchParams = urlParams;
    }

    if (!['get', 'delete'].includes(result.method) && params.request) {
      result.json = params.request;
    }

    return result;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt?: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    const oauth_type = sourceOptions?.oauth_type?.value;
    if (oauth_type === 'tooljet_app') {
      sourceOptions['client_id'] = process.env.GOOGLE_CLIENT_ID;
      sourceOptions['client_secret'] = process.env.GOOGLE_CLIENT_SECRET;
    }

    let result = {};
    let response = null;
    const operation = queryOptions.operation;
    const spreadsheetId = queryOptions.spreadsheet_id;
    const spreadsheetRange = queryOptions.spreadsheet_range ? queryOptions.spreadsheet_range : 'A1:Z500';
    let accessToken = '';
    if (sourceOptions['authentication_type'] === 'service_account') {
      accessToken = await this.getConnection(sourceOptions);
    } else {
      accessToken = sourceOptions['access_token'];
    }

    const queryOptionFilter = {
      key: queryOptions.where_field,
      value: queryOptions.where_value,
    };

    if (sourceOptions['multiple_auth_enabled']) {
      const customHeaders = { 'tj-x-forwarded-for': '::1' };
      const newSourceOptions = this.constructSourceOptions(sourceOptions);
      const authValidatedRequestOptions = this.convertQueryOptions(queryOptions, customHeaders);

      const _requestOptions = await validateAndSetRequestOptionsBasedOnAuthType(
        newSourceOptions,
        context,
        authValidatedRequestOptions as any,
        { kind: 'googlesheetsv2' }
      );

      if (_requestOptions.status === 'needs_oauth') {
        return _requestOptions;
      }
      const requestOptions = _requestOptions.data as OptionsOfTextResponseBody;
      const authHeader = requestOptions.headers['Authorization'];

      if (Array.isArray(authHeader)) {
        accessToken = authHeader[0].replace('Bearer ', '');
      } else if (typeof authHeader === 'string') {
        accessToken = authHeader.replace('Bearer ', '');
      }
    }

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
          if (!queryOptions.sheet) {
            throw new Error('Sheet is required for read operation');
          }

          result = await readData(
            spreadsheetId,
            spreadsheetRange,
            queryOptions.sheet,
            this.authHeader(accessToken),
            queryOptions.majorDimension,
            queryOptions.valueRenderOption,
            queryOptions.dateTimeRenderOption
          );
          break;

        case 'create':
          result = await createSpreadSheet(queryOptions.title, this.authHeader(accessToken));
          break;

        case 'list_all':
          result = await listAllSheets(queryOptions.spreadsheet_id, this.authHeader(accessToken));
          break;
        case 'list_all_spreadsheets':
          result = await listAllSpreadsheets(
            this.authHeader(accessToken),
            queryOptions.page_size,
            queryOptions.page_token,
            queryOptions.filter
          );
          break;
        case 'delete_by_filter':
          {
            const filters = queryOptions.filter ? JSON.parse(queryOptions.filter) : [];
            result = await deleteFromSpreadsheetByFilter(
              queryOptions.spreadsheet_id,
              filters,
              this.authHeader(accessToken)
            );
          }
          break;
        case 'bulk_update_by_primary_key':
          {
            const { sheet, primary_key, rows } = queryOptions;
            if (!primary_key || !rows || !sheet)
              throw new Error('sheet, primary_key, and rows are required for bulk_update_by_primary_key');

            const parsedRows = typeof rows === 'string' ? JSON.parse(rows) : rows;

            result = await bulkUpdateByPrimaryKey(
              spreadsheetId,
              sheet,
              primary_key,
              parsedRows,
              this.authHeader(accessToken)
            );
          }
          break;
        case 'copy_spreadsheet':
          result = await copySpreadsheetData(
            queryOptions.source_spreadsheet_id,
            queryOptions.destination_spreadsheet_id,
            this.authHeader(accessToken),
            queryOptions.source_range,
            queryOptions.destination_range
          );
          break;
        case 'delete_by_range':
          if (!queryOptions.sheet) {
            throw new Error('Sheet is required for delete_by_range operation');
          }

          result = await deleteByRange(
            queryOptions.spreadsheet_id,
            queryOptions.sheet,
            queryOptions.spreadsheet_range,
            queryOptions.shiftDimension,
            this.authHeader(accessToken)
          );
          break;
        case 'update_spreadsheet':
          if (!queryOptions.sheet) {
            throw new Error('Sheet is required for update_spreadsheet operation');
          }
          result = await updateSpreadsheet(
            queryOptions.spreadsheet_id,
            queryOptions.sheet,
            queryOptions.spreadsheet_range,
            queryOptions.values,
            queryOptions.ValueInputOption || 'USER_ENTERED',
            this.authHeader(accessToken)
          );
          break;

        case 'append':
          if (!queryOptions.sheet) {
            throw new Error('Sheet is required for append operation');
          }
          result = await appendData(spreadsheetId, queryOptions.sheet, queryOptions.rows, this.authHeader(accessToken));
          break;

        case 'update':
          if (!queryOptions.sheet) {
            throw new Error('Sheet is required for update operation');
          }
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
          if (!queryOptions.sheet) {
            throw new Error('GID is required for delete_row operation');
          }
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
      let errorDetails = {};
      if (error.response) {
        const errorRespose = JSON.parse(error.response.body);
        errorDetails = {
          message: errorRespose?.error?.message,
          status: errorRespose?.error?.status,
        };
      }

      if (error.message.replace(/\s+/g, ' ').trim().includes('Unexpected token in JSON')) {
        errorDetails = {
          message: 'Invalid JSON',
        };
      }
      // For OAuth if token is expired or invalid it returns 401 or 403
      // For other authentication types just throw generic error so that user can re-authenticate
      const statusCode =
        error.response?.statusCode ||
        error.description?.statusCode ||
        error.data?.statusCode ||
        error.statusCode ||
        error.data?.response?.statusCode ||
        error.data?.error?.statusCode ||
        error.data?.error?.response?.statusCode;

      if (sourceOptions['authentication_type'] !== 'service_account' && (statusCode === 401 || statusCode === 403)) {
        throw new OAuthUnauthorizedClientError('Query could not be completed', error.message, {
          ...error,
          ...errorDetails,
        });
      }
      throw new QueryError('Query could not be completed', error.message, errorDetails);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async invokeMethod(
    methodName: string,
    context: { user?: User; app?: App },
    sourceOptions: any,
    args?: any
  ): Promise<any> {
    let accessToken = '';
    if (sourceOptions['multiple_auth_enabled']) {
      const customHeaders = { 'tj-x-forwarded-for': '::1' };
      const newSourceOptions = this.constructSourceOptions(sourceOptions);
      const queryOptions = {};
      const authValidatedRequestOptions = this.convertQueryOptions(queryOptions, customHeaders);

      const _requestOptions = await validateAndSetRequestOptionsBasedOnAuthType(
        newSourceOptions,
        context,
        authValidatedRequestOptions as any,
        { kind: 'googlesheetsv2' }
      );

      if (_requestOptions.status === 'needs_oauth') {
        throw new QueryError(
          'Could not connect to Googlesheets',
          JSON.stringify({
            statusCode: 401,
            message: 'OAuth authentication required',
            data: 'OAuth authentication required',
          }),
          {}
        );
      }
      const requestOptions = _requestOptions.data as OptionsOfTextResponseBody;
      const authHeader = requestOptions.headers['Authorization'];

      if (Array.isArray(authHeader)) {
        accessToken = authHeader[0].replace('Bearer ', '');
      } else if (typeof authHeader === 'string') {
        accessToken = authHeader.replace('Bearer ', '');
      }
    } else {
      accessToken = sourceOptions['access_token'];
    }
    if (methodName === 'getSpreadsheets') {
      return await this.getSpreadsheets(sourceOptions, accessToken);
    }

    if (methodName === 'getSheets') {
      return await this.getSheets(sourceOptions, accessToken, args);
    }

    throw new QueryError('Method not found', `Method ${methodName} is not supported for Google Sheets plugin`, {
      availableMethods: ['getSpreadsheets', 'getSheets'],
    });
  }

  private async getSpreadsheets(sourceOptions: any, accessToken: string): Promise<any> {
    if (sourceOptions['authentication_type'] === 'service_account') {
      accessToken = await this.getConnection(sourceOptions);
    } else {
      if (!accessToken) {
        throw new OAuthUnauthorizedClientError(
          'Authentication required',
          'Google Sheets access token not found. Please authenticate first.',
          {}
        );
      }
    }

    try {
      const result = await listAllSpreadsheets(this.authHeader(accessToken));
      const spreadsheets = result.files || [];

      return {
        data: spreadsheets.map((s: any) => ({
          label: s.name,
          value: s.id,
        })),
      };
    } catch (error: any) {
      const statusCode =
        error.response?.statusCode ||
        error.description?.statusCode ||
        error.data?.statusCode ||
        error.statusCode ||
        error.data?.response?.statusCode ||
        error.data?.error?.statusCode ||
        error.data?.error?.response?.statusCode;
      if (statusCode === 401 || statusCode === 403) {
        throw new OAuthUnauthorizedClientError('Unauthorized', 'OAuth token expired or invalid', {});
      }
      throw error;
    }
  }

  private async getSheets(sourceOptions: any, accessToken: string, args?: any): Promise<any> {
    const spreadsheetId = args?.values?.spreadsheet_id;
    if (!spreadsheetId) {
      return { data: [] };
    }

    if (sourceOptions['authentication_type'] === 'service_account') {
      accessToken = await this.getConnection(sourceOptions);
    } else {
      if (!accessToken) {
        throw new OAuthUnauthorizedClientError(
          'Authentication required',
          'Google Sheets access token not found. Please authenticate first.',
          {}
        );
      }
    }

    try {
      const result = await listAllSheets(spreadsheetId, this.authHeader(accessToken));
      const sheets = result.sheets || [];

      return {
        data: sheets.map((s: any) => ({
          label: s.properties.title,
          value: s.properties.title,
        })),
      };
    } catch (error: any) {
      const statusCode =
        error.response?.statusCode ||
        error.description?.statusCode ||
        error.data?.statusCode ||
        error.statusCode ||
        error.data?.response?.statusCode ||
        error.data?.error?.statusCode ||
        error.data?.error?.response?.statusCode;
      if (statusCode === 401 || statusCode === 403) {
        throw new OAuthUnauthorizedClientError('Unauthorized', 'OAuth token expired or invalid', {});
      }
      throw new QueryError('Failed to fetch sheets', error.message, error);
    }
  }

  async refreshToken(sourceOptions, dataSourceId, userId, isAppPublic) {
    let refreshToken: string;

    const currentUserToken = sourceOptions['refresh_token']
      ? sourceOptions
      : getCurrentToken(sourceOptions['multiple_auth_enabled'], sourceOptions['tokenData'], userId, isAppPublic);
    if (currentUserToken && currentUserToken['refresh_token']) {
      refreshToken = currentUserToken['refresh_token'];
    } else {
      throw new QueryError(
        'could not connect to Googlesheets',
        'Refresh token not found. Please re-authenticate to continue.',
        {}
      );
    }
    const accessTokenUrl = 'https://oauth2.googleapis.com/token';
    let clientId = '';
    let clientSecret = '';
    const oauth_type = sourceOptions['oauth_type'];

    if (oauth_type === 'tooljet_app') {
      clientId = process.env.GOOGLE_CLIENT_ID;
      clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    } else {
      clientId = sourceOptions['client_id'];
      clientSecret = sourceOptions['client_secret'];
    }
    const grantType = 'refresh_token';

    const data = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType,
      refresh_token: refreshToken,
    };

    const accessTokenDetails = {};

    try {
      const response = await got(accessTokenUrl, {
        method: 'post',
        json: data,
        headers: { 'Content-Type': 'application/json' },
      });
      const result = JSON.parse(response.body);

      if (!(response.statusCode >= 200 && response.statusCode < 300)) {
        throw new QueryError(
          'could not connect to Googlesheets',
          JSON.stringify({ statusCode: response?.statusCode, message: response?.body }),
          {}
        );
      }

      if (result['access_token']) {
        accessTokenDetails['access_token'] = result['access_token'];
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

  async getServiceAccountToken(sourceOptions) {
    const serviceAccountKey = JSON.parse(sourceOptions['service_account_key']);
    serviceAccountKey.private_key = serviceAccountKey.private_key.replace(/\\n/g, '\n');

    const scopes =
      sourceOptions?.access_type === 'write'
        ? ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.metadata.readonly']
        : [
            'https://www.googleapis.com/auth/spreadsheets.readonly',
            'https://www.googleapis.com/auth/drive.metadata.readonly',
          ];

    const jwtClient = new google.auth.JWT({
      email: serviceAccountKey?.client_email,
      key: serviceAccountKey?.private_key,
      scopes,
    });
    const tokenResponse = await jwtClient.authorize();

    if (!tokenResponse || !tokenResponse.access_token)
      throw new QueryError(
        'Connection could not be established',
        'Failed to obtain access token for service account',
        {}
      );
    return tokenResponse.access_token;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    if (sourceOptions['authentication_type'] !== 'service_account') {
      throw new QueryError(
        'Connection could not be established',
        'For test connection only service account authentication is supported',
        {}
      );
    }

    const accessToken = await this.getConnection(sourceOptions);
    const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
    if (response.ok) {
      return { status: 'ok' };
    } else {
      return { status: 'failed' };
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    if (isEmpty(sourceOptions['service_account_key']))
      throw new QueryError('Connection could not be established', 'Service account key is required', {});
    const accessToken = await this.getServiceAccountToken(sourceOptions);
    return accessToken;
  }
}
