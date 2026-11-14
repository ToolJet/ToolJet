import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
  OAuthUnauthorizedClientError,
} from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';

export default class Dropbox implements QueryService {
  private validateSourceOptions(sourceOptions: SourceOptions) {
    const { client_id, client_secret } = sourceOptions;

    if (!client_id?.value || !client_secret?.value) {
      throw new Error('Missing required source options: client_id and client_secret.');
    }
  }

  authUrl(sourceOptions: SourceOptions): string {
    this.validateSourceOptions(sourceOptions);

    const { client_id } = sourceOptions;
    const tj_redirect_host = (sourceOptions as any).tj_redirect_host;

    const clientId = client_id?.value;

    if (!clientId) {
      throw new Error('Missing required source option: client_id.');
    }

    const host = tj_redirect_host?.value || process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const redirectBaseUrl = `${host}${subpath ? subpath : '/'}`;

    return (
      'https://www.dropbox.com/oauth2/authorize' +
      `?client_id=${clientId.trim()}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(`${redirectBaseUrl}oauth2/authorize`)}` +
      `&token_access_type=offline`
    );
  }

  async accessDetailsFrom(authCode: string, sourceOptions: any, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }

    let clientId = '';
    let clientSecret = '';
    let redirectHost = '';

    for (const item of sourceOptions) {
      if (item.key === 'client_id') {
        clientId = item.value;
      }

      if (item.key === 'client_secret') {
        clientSecret = item.value;
      }

      if (item.key === 'tj_redirect_host') {
        redirectHost = item.value;
      }
    }

    const host = redirectHost || process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const redirectUri = `${host}${subpath ? subpath : '/'}oauth2/authorize`;

    const data = new URLSearchParams({
      code: authCode,
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error_description || 'Could not connect to Dropbox');
    }

    const authDetails = [];

    if (result.access_token) {
      authDetails.push(['access_token', result.access_token]);
    }

    if (result.refresh_token) {
      authDetails.push(['refresh_token', result.refresh_token]);
    }

    return authDetails;
  }

  async refreshToken(sourceOptions: any) {
    const refreshToken = sourceOptions.refresh_token;
    const clientId = sourceOptions.client_id;
    const clientSecret = sourceOptions.client_secret;

    if (!refreshToken) {
      throw new QueryError('Query could not be completed', 'Refresh token not found', {});
    }

    const data = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data.toString(),
    });

    const result = await response.json();

    if (!response.ok || !result.access_token) {
      throw new QueryError(
        'Query could not be completed',
        result?.error_description || 'Could not refresh Dropbox access token',
        {}
      );
    }

    return {
      access_token: result.access_token,
      refresh_token: refreshToken,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const accessToken = (sourceOptions as any).access_token;

    const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new OAuthUnauthorizedClientError('Unauthorized', 'Dropbox access token expired or is invalid', {});
      }

      throw new QueryError('Connection failed', 'Could not connect to Dropbox', {
        statusCode: response.status,
      });
    }

    return {
      status: 'ok',
    };
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const accessToken = (sourceOptions as any).access_token;

    if (queryOptions.operation === 'upload') {
      if (!queryOptions.path) {
        throw new QueryError('Query could not be completed', 'Dropbox path is required for upload', {});
      }

      if (queryOptions.file_content === undefined || queryOptions.file_content === null) {
        throw new QueryError('Query could not be completed', 'File data is required for upload', {});
      }

      const encoding = queryOptions.encoding || 'utf8';

      if (encoding !== 'utf8' && encoding !== 'base64') {
        throw new QueryError('Query could not be completed', 'Encoding must be either utf8 or base64', {});
      }

      const uploadBody =
        encoding === 'base64'
          ? Buffer.from(queryOptions.file_content, 'base64')
          : Buffer.from(queryOptions.file_content, 'utf8');

      const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: queryOptions.path,
            mode: 'add',
            autorename: true,
            mute: false,
          }),
        },
        body: uploadBody,
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new OAuthUnauthorizedClientError(
            'Unauthorized',
            result?.error_summary || 'Dropbox access token expired or is invalid',
            {}
          );
        }

        throw new QueryError('Query could not be completed', result?.error_summary || 'Dropbox upload failed', {
          statusCode: response.status,
          error: result,
        });
      }

      return {
        status: 'ok',
        data: result,
      };
    }

    if (queryOptions.operation === 'download') {
      const response = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({
            path: queryOptions.path,
          }),
        },
      });

      if (!response.ok) {
        let error: any = {};

        try {
          error = await response.json();
        } catch {
          error = {
            message: 'Dropbox returned a non-JSON error response',
          };
        }

        if (response.status === 401) {
          throw new OAuthUnauthorizedClientError(
            'Unauthorized',
            error?.error_summary || 'Dropbox access token expired or is invalid',
            {}
          );
        }

        throw new QueryError('Query could not be completed', error?.error_summary || 'Dropbox download failed', {
          statusCode: response.status,
          error,
        });
      }

      const arrayBuffer = await response.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const metadataHeader = response.headers.get('Dropbox-API-Result');

      let metadata = {};

      if (metadataHeader) {
        try {
          metadata = JSON.parse(metadataHeader);
        } catch {
          metadata = {
            raw: metadataHeader,
          };
        }
      }

      return {
        status: 'ok',
        data: {
          metadata,
          content: fileBuffer.toString('base64'),
          encoding: 'base64',
        },
      };
    }

    let url = '';
    let body: Record<string, any> | undefined;

    switch (queryOptions.operation) {
      case 'get_current_account':
        url = 'https://api.dropboxapi.com/2/users/get_current_account';
        break;

      case 'list_folder':
        url = 'https://api.dropboxapi.com/2/files/list_folder';
        body = {
          path: queryOptions.path || '',
        };
        break;

      case 'get_metadata':
        url = 'https://api.dropboxapi.com/2/files/get_metadata';
        body = {
          path: queryOptions.path,
        };
        break;

      case 'create_folder':
        url = 'https://api.dropboxapi.com/2/files/create_folder_v2';
        body = {
          path: queryOptions.path,
          autorename: false,
        };
        break;

      case 'move':
        url = 'https://api.dropboxapi.com/2/files/move_v2';
        body = {
          from_path: queryOptions.from_path,
          to_path: queryOptions.to_path,
          autorename: false,
        };
        break;

      case 'copy':
        url = 'https://api.dropboxapi.com/2/files/copy_v2';
        body = {
          from_path: queryOptions.from_path,
          to_path: queryOptions.to_path,
          autorename: false,
        };
        break;

      case 'delete':
        url = 'https://api.dropboxapi.com/2/files/delete_v2';
        body = {
          path: queryOptions.path,
        };
        break;

      case 'search':
        url = 'https://api.dropboxapi.com/2/files/search_v2';
        body = {
          query: queryOptions.query,
          options: queryOptions.path
            ? {
                path: queryOptions.path,
              }
            : undefined,
        };
        break;

      case 'create_shared_link':
        url = 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings';
        body = {
          path: queryOptions.path,
        };
        break;

      default:
        throw new QueryError('Query could not be completed', 'Unsupported Dropbox operation', {});
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      ...(body && {
        body: JSON.stringify(body),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new OAuthUnauthorizedClientError(
          'Unauthorized',
          result?.error_summary || 'Dropbox access token expired or is invalid',
          {
            statusCode: response.status,
            error: result,
          }
        );
      }

      throw new QueryError('Query could not be completed', result?.error_summary || 'Dropbox API request failed', {
        statusCode: response.status,
        error: result,
      });
    }

    return {
      status: 'ok',
      data: result,
    };
  }
}
