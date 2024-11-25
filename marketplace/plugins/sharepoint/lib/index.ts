import { OAuthUnauthorizedClientError, QueryError, QueryResult, QueryService } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';

export default class Sharepoint implements QueryService {
  authUrl(sourceOptions): string {
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const clientId = sourceOptions.sp_client_id;
    const clientSecret = sourceOptions.sp_client_secret.value;
    const tenant = sourceOptions.sp_tenant_id;

    if (!clientId || !clientSecret || !tenant) {
      throw Error('You need to enter the client ID, client secret and tenant ID for authentication.');
    }

    return (
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize' +
      `?client_id=${clientId.value}&response_type=code` +
      `&redirect_uri=${fullUrl}oauth2/authorize`
    );
  }

  async accessDetailsFrom(authCode: string, sourceOptions: any, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }

    let sp_client_id = '';
    let sp_client_secret = '';
    let tenant = '';

    for (const item of sourceOptions) {
      if (item.key === 'sp_client_id') {
        sp_client_id = item.value;
      }
      if (item.key === 'sp_client_secret') {
        sp_client_secret = item.value;
      }
      if (item.key === 'sp_tenant_id') {
        tenant = item.value;
      }
    }

    const accessTokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;

    const data = new URLSearchParams({
      code: authCode,
      client_id: sp_client_id,
      client_secret: sp_client_secret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      scope: 'https://graph.microsoft.com/.default+offline_access',
    });

    const authDetails = [];

    try {
      const response = await fetch(accessTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data.toString(),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`Error occurred: `, result);
        throw new Error(result.error_description);
      }

      if (result['access_token']) {
        authDetails.push(['access_token', result['access_token']]);
      }

      if (result['refresh_token']) {
        authDetails.push(['refresh_token', result['refresh_token']]);
      }
    } catch (error) {
      throw Error(`Could not connect to Sharepoint:\n${error?.message}`);
    }

    return authDetails;
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const rootApiUrl = 'https://graph.microsoft.com/v1.0/sites';
    const accessToken = sourceOptions.access_token;
    let response = null;
    let data = null;

    try {
      const requestOptions = await this.fetchRequestOptsForOperation(accessToken, queryOptions);
      const endpoint = requestOptions?.endpoint;
      const apiUrl = `${rootApiUrl}${endpoint}`;
      const method = requestOptions?.method;
      const header = requestOptions?.headers;
      const body = requestOptions.body || {};

      if (requestOptions?.paginationFeature && queryOptions.sp_page) {
        const regex = /^[1-9]\d*(\.\d+)?$/;
        if (regex.test(queryOptions.sp_page)) {
          const pageNo = parseInt(queryOptions.sp_page || '1');
          const paginatedResponse = await this.getPageData(apiUrl, pageNo, header);
          response = paginatedResponse.response;
          data = paginatedResponse.data;
        } else {
          throw new Error('Page field value should be a number >= 1.');
        }
      } else {
        response = await fetch(apiUrl, {
          method: method,
          headers: header,
          ...(Object.keys(body).length !== 0 && { body: JSON.stringify(body) }),
        });

        if (
          !response.ok &&
          response.status !== 401 &&
          response.status !== 403 &&
          response.status !== 204 &&
          response.status !== 201
        ) {
          const data = await response.json();
          const errorMessage = data?.error?.message || 'An unknown error occurred';
          throw new QueryError('Query could not be completed', errorMessage, {
            statusCode: response.status,
            ...data?.error,
          });
        }

        if (response.status === 204) {
          return {
            status: 'ok',
            data: {
              code: response.status,
              status: response.statusText,
              message: `Item having id '${queryOptions.sp_item_id}' in List '${queryOptions.sp_list_id}' has been deleted.`,
            },
          };
        }

        data = await response.json();
      }
    } catch (error) {
      const errorMessage = error?.message === 'Query could not be completed' ? error?.description : error?.message;
      throw new QueryError('Query could not be completed', errorMessage, error?.data || {});
    }

    if (response.status === 401 || response.status === 403) {
      throw new OAuthUnauthorizedClientError('Unauthorized client error', response.statusText, data);
    }

    return {
      status: 'ok',
      data: data,
    };
  }

  async getPageData(apiUrl: string, pageNo: number, header: any): Promise<any> {
    let currentPage = 1;
    let nextApiUrl = apiUrl;
    let result = null;

    while (currentPage <= pageNo) {
      const response = await fetch(nextApiUrl, {
        method: 'GET',
        headers: header,
      });

      const data = await response.json();

      if (!response.ok && response.status !== 401 && response.status !== 403) {
        throw new QueryError('Query could not be completed', data?.error?.message || 'An unknown error occurred', {
          statusCode: response.status,
          ...data?.error,
        });
      }

      if (currentPage === pageNo) {
        result = { response: response, data: data };
        break;
      }

      if (!data['@odata.nextLink']) {
        throw new Error('No more pages available.');
      }

      nextApiUrl = data['@odata.nextLink'];
      currentPage++;
    }

    return result;
  }

  async fetchRequestOptsForOperation(accessToken: string, queryOptions: QueryOptions): Promise<any> {
    const {
      sp_operation,
      sp_site_id,
      sp_time_interval,
      sp_list_id,
      sp_list_name,
      sp_item_id,
      sp_list_object,
      sp_item_object,
      sp_top,
    } = queryOptions;

    const authHeader = {
      Authorization: `Bearer ${accessToken}`,
    };

    switch (sp_operation) {
      case 'get_sites':
        return {
          method: 'GET',
          endpoint: `?search=*${sp_top ? `&$top=${sp_top}` : ''}`,
          headers: { ...authHeader },
          paginationFeature: true,
        };
      case 'get_site':
        return {
          method: 'GET',
          endpoint: `/${sp_site_id}`,
          headers: { ...authHeader },
        };
      case 'get_analytics':
        return {
          method: 'GET',
          endpoint: `/${sp_site_id}/analytics/${sp_time_interval}`,
          headers: { ...authHeader },
        };
      case 'get_pages':
        return {
          method: 'GET',
          endpoint: `/${sp_site_id}/pages${sp_top ? `?&$top=${sp_top}` : ''}`,
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          paginationFeature: true,
        };
      case 'get_lists':
        return {
          method: 'GET',
          endpoint: `/${sp_site_id}/lists`,
          headers: { ...authHeader },
          paginationFeature: true,
        };
      case 'get_metadata':
        return {
          method: 'GET',
          endpoint: `/${sp_site_id}/lists/${sp_list_id || sp_list_name}?expand=columns,items(expand=fields)`,
          headers: { ...authHeader },
        };
      case 'get_items':
        return {
          method: 'GET',
          endpoint: `/${sp_site_id}/lists/${sp_list_id}/items?$expand=fields${sp_top ? `&$top=${sp_top}` : ''}`,
          headers: { ...authHeader },
          paginationFeature: true,
        };
      case 'create_list':
        return {
          method: 'POST',
          endpoint: `/${sp_site_id}/lists`,
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.parse(sp_list_object),
        };
      case 'add_item':
        return {
          method: 'POST',
          endpoint: `/${sp_site_id}/lists/${sp_list_id}/items`,
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.parse(sp_item_object),
        };
      case 'update_item':
        return {
          method: 'PATCH',
          endpoint: `/${sp_site_id}/lists/${sp_list_id}/items/${sp_item_id}/fields`,
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.parse(sp_item_object),
        };
      case 'delete_item':
        return {
          method: 'DELETE',
          endpoint: `/${sp_site_id}/lists/${sp_list_id}/items/${sp_item_id}`,
          headers: { ...authHeader },
        };
      default:
        return { method: '', endpoint: '', headers: {}, body: {} };
    }
  }

  async refreshToken(sourceOptions) {
    if (!sourceOptions['refresh_token']) {
      throw new QueryError('Query could not be completed', 'Refresh token empty', {});
    }

    const tenant = sourceOptions.sp_tenant_id;
    const accessTokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const clientId = sourceOptions.sp_client_id;
    const clientSecret = sourceOptions.sp_client_secret;

    const data = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: sourceOptions['refresh_token'],
      scope: 'https://graph.microsoft.com/.default',
    });

    const accessTokenDetails = {};

    try {
      const response = await fetch(accessTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data.toString(),
      });
      const result = await response.json();

      if (result['access_token']) {
        accessTokenDetails['access_token'] = result['access_token'];
        accessTokenDetails['refresh_token'] = result['refresh_token'];
      } else {
        throw new QueryError(
          'access_token not found in the response',
          {},
          {
            responseObject: {
              statusCode: response.status,
              responseBody: result,
            },
            responseHeaders: response.headers,
          }
        );
      }
    } catch (error) {
      console.error(`Error while Sharepoint refresh token call. ${JSON.stringify(error)}`);
      throw new QueryError('could not connect to Sharepoint', JSON.stringify(error), {});
    }
    return accessTokenDetails;
  }
}
