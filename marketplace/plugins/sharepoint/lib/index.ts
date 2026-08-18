import { OAuthUnauthorizedClientError, QueryError, QueryResult, QueryService } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';

const GRAPH_ROOT = 'https://graph.microsoft.com/v1.0';

// Path segments that begin a site's *contents* rather than a nested site. A pasted browser URL
// usually points at a page or a library inside the site ("/sites/marketing/SitePages/Home.aspx",
// "/teams/eng/Shared Documents/..."), and everything from one of these segments onward has to be
// dropped to leave the site's own server-relative path. Anything else is kept, so subsites
// ("/sites/marketing/research") still resolve to the subsite rather than its parent.
const SITE_CONTENT_SEGMENTS = new Set([
  '_layouts',
  '_api',
  '_vti_bin',
  '_catalogs',
  'lists',
  'sitepages',
  'siteassets',
  'sitecollectiondocuments',
  'sitecollectionimages',
  'shared documents',
  'documents',
  'style library',
  'forms',
  'formservertemplates',
]);

// "<hostname>|<site path>" -> Graph site id. A site's id is stable for a given URL (renaming a site
// changes its URL, and therefore the key), so entries never need to expire.
const SITE_ID_CACHE = new Map<string, string>();

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
      throw Error(`Could not connect to SharePoint:\n${error?.message}`);
    }

    return authDetails;
  }

  /**
   * Splits the configured Site URL into the hostname and the site's own server-relative path.
   *
   * Users paste whatever is in the address bar, which is normally a page or library inside the
   * site rather than the site root. Everything from the first content segment onward is dropped,
   * as is any trailing `.aspx` page, leaving just the site. A URL with no site path at all (or one
   * that is only content, e.g. "contoso.sharepoint.com/SitePages/Home.aspx") is the root site.
   */
  siteLocationFrom(siteUrl: string): { hostname: string; path: string } {
    let parsed: URL;
    try {
      // A pasted value often has no scheme ("contoso.sharepoint.com/sites/x"); give it one.
      parsed = new URL(/^https?:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`);
    } catch {
      throw new QueryError(
        'Invalid Site URL',
        `"${siteUrl}" is not a valid SharePoint site URL. Use the address of your site, e.g. https://contoso.sharepoint.com/sites/marketing.`,
        { code: 'INVALID_SITE_URL' }
      );
    }

    const segments: string[] = [];
    for (const rawSegment of parsed.pathname.split('/')) {
      if (!rawSegment) continue;
      // %20 and friends must be decoded before comparing ("Shared%20Documents").
      let segment: string;
      try {
        segment = decodeURIComponent(rawSegment);
      } catch {
        segment = rawSegment;
      }
      const normalized = segment.toLowerCase();
      if (SITE_CONTENT_SEGMENTS.has(normalized) || normalized.endsWith('.aspx')) break;
      segments.push(segment);
    }

    return { hostname: parsed.hostname.toLowerCase(), path: segments.join('/') };
  }

  /**
   * The Graph site id for the configured Site URL. Every operation is scoped to this one site —
   * the id is a connection property, never a query field, so nothing has to know the
   * "hostname,guid,guid" form Graph uses.
   */
  async resolveSiteId(sourceOptions: SourceOptions, accessToken: string): Promise<string> {
    const siteUrl = (sourceOptions.sp_site_url || '').trim();
    if (!siteUrl) {
      throw new QueryError(
        'Site not configured',
        'Set the Site URL on the SharePoint datasource (e.g. https://contoso.sharepoint.com/sites/marketing) so queries know which site to call.',
        { code: 'MISSING_SITE_URL' }
      );
    }

    // Escape hatch: an already-resolved Graph site id ("hostname,guid,guid") is used as-is.
    if (siteUrl.includes(',') && !siteUrl.includes('/')) return siteUrl;

    const { hostname, path } = this.siteLocationFrom(siteUrl);
    const cacheKey = `${hostname}|${path}`;
    const cached = SITE_ID_CACHE.get(cacheKey);
    if (cached) return cached;

    // Graph addresses a site by path as /sites/{hostname}:/{site-relative-path}; a bare hostname
    // is the root site.
    const lookupUrl = path
      ? `${GRAPH_ROOT}/sites/${hostname}:/${path.split('/').map(encodeURIComponent).join('/')}`
      : `${GRAPH_ROOT}/sites/${hostname}`;

    const response = await fetch(lookupUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
      throw new OAuthUnauthorizedClientError(
        'Unauthorized client error',
        body?.error?.message || response.statusText,
        body
      );
    }

    if (!response.ok || !body?.id) {
      throw new QueryError(
        'Site not found',
        `Could not resolve "${siteUrl}" to a SharePoint site (looked up ${
          path ? `${hostname}:/${path}` : hostname
        }). ${body?.error?.message || ''} Check the Site URL on the datasource — it should be the address of the site itself, e.g. https://contoso.sharepoint.com/sites/marketing.`,
        { code: 'SITE_NOT_FOUND', statusCode: response.status, hostname, path, ...(body?.error || {}) }
      );
    }

    SITE_ID_CACHE.set(cacheKey, body.id);
    return body.id;
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const rootApiUrl = 'https://graph.microsoft.com/v1.0/sites';
    const accessToken = sourceOptions.access_token;
    let response = null;
    let data = null;

    try {
      const siteId = await this.resolveSiteId(sourceOptions, accessToken);
      const requestOptions = await this.fetchRequestOptsForOperation(accessToken, queryOptions, siteId);
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
      // ToolJet decides whether to run the refresh-token flow by looking at the error's class
      // (`api_error.constructor.name === 'OAuthUnauthorizedClientError'`), so an auth failure has to
      // leave this block with its type intact. Rewrapping it as a QueryError — which is what the
      // 401/403 check below deliberately sidesteps by sitting outside the try — silently disables
      // token refresh, and every query then fails permanently once the access token expires.
      if (error instanceof OAuthUnauthorizedClientError) throw error;
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

  async fetchRequestOptsForOperation(accessToken: string, queryOptions: QueryOptions, siteId: string): Promise<any> {
    const {
      sp_operation,
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
          endpoint: `/${siteId}`,
          headers: { ...authHeader },
        };
      case 'get_analytics':
        return {
          method: 'GET',
          endpoint: `/${siteId}/analytics/${sp_time_interval}`,
          headers: { ...authHeader },
        };
      case 'get_pages':
        return {
          method: 'GET',
          endpoint: `/${siteId}/pages${sp_top ? `?&$top=${sp_top}` : ''}`,
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          paginationFeature: true,
        };
      case 'get_lists':
        return {
          method: 'GET',
          endpoint: `/${siteId}/lists`,
          headers: { ...authHeader },
          paginationFeature: true,
        };
      case 'get_metadata':
        return {
          method: 'GET',
          endpoint: `/${siteId}/lists/${sp_list_id || sp_list_name}?expand=columns,items(expand=fields)`,
          headers: { ...authHeader },
        };
      case 'get_items':
        return {
          method: 'GET',
          endpoint: `/${siteId}/lists/${sp_list_id}/items?$expand=fields${sp_top ? `&$top=${sp_top}` : ''}`,
          headers: { ...authHeader },
          paginationFeature: true,
        };
      case 'create_list':
        return {
          method: 'POST',
          endpoint: `/${siteId}/lists`,
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.parse(sp_list_object),
        };
      case 'add_item':
        return {
          method: 'POST',
          endpoint: `/${siteId}/lists/${sp_list_id}/items`,
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.parse(sp_item_object),
        };
      case 'update_item':
        return {
          method: 'PATCH',
          endpoint: `/${siteId}/lists/${sp_list_id}/items/${sp_item_id}/fields`,
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.parse(sp_item_object),
        };
      case 'delete_item':
        return {
          method: 'DELETE',
          endpoint: `/${siteId}/lists/${sp_list_id}/items/${sp_item_id}`,
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
      console.error(`Error while SharePoint refresh token call. ${JSON.stringify(error)}`);
      throw new QueryError('could not connect to SharePoint', JSON.stringify(error), {});
    }
    return accessTokenDetails;
  }
}
