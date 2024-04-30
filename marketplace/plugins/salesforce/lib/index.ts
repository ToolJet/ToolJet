import { QueryError, QueryResult, QueryService } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import jsforce from 'jsforce';

export default class Salesforce implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    //sourceOptions.redirect_uri = this.authUrl();
    let result = {};
    let response = null;

    const client_id = sourceOptions.client_id;
    const client_secret = sourceOptions.client_secret;
    const instanceUrl = sourceOptions.instanceUrl;
    const access_token = sourceOptions.access_token;
    const operation = queryOptions.operation;
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirect_uri = `${fullUrl}oauth2/authorize`;

    const oauth2 = new jsforce.OAuth2({
      clientId: client_id,
      clientSecret: client_secret,
      redirectUri: redirect_uri,
    });

    const conn = new jsforce.Connection({
      oauth2: oauth2,
      instanceUrl: instanceUrl,
      accessToken: access_token,
    });

    try {
      switch (operation) {
        case 'soql': {
          const query = queryOptions.soql_query;
          result = await conn.query(query);
          break;
        }
        case 'crud': {
          const actiontype = queryOptions.actiontype;
          const resource_name = queryOptions.resource_name;
          const resource_id = queryOptions.resource_id;
          const resource_body = queryOptions.resource_body;

          switch (actiontype) {
            case 'retrieve':
              response = await conn.sobject(resource_name).retrieve(resource_id);
              result = response;
              break;

            case 'create':
              response = await conn.sobject('Account').create(resource_body);
              result = response;
              break;

            case 'update':
              response = await conn.sobject(resource_name).update({ Id: resource_id, ...resource_body });
              result = response;
              break;

            // TODO -> extIdField is not present in the upsert
            // case 'upsert':
            //   response = await conn.sobject(resource_name).upsert(resource_body)
            //   break;

            case 'delete':
              response = await conn.sobject(resource_name).destroy(resource_id);
              result = response;
              break;

            default:
              throw new QueryError('Invalid CRUD operation', 'Please specify a valid operation', {});
          }
          break;
        }
        case 'bulkLoad': {
          const crud_action = queryOptions.crud_action;
          const object_type = queryOptions.object_type;
          const records = queryOptions.records;
          const job = conn.bulk.createJob(object_type, crud_action);
          const batch = job.createBatch();

          batch.execute(records);

          batch.on('error', function (err) {
            throw new QueryError('Bulk Load Error', err.message, {});
          });

          batch.on('queue', function (batchInfo) {
            console.log('Batch Queued:', batchInfo);
            batch.poll(1000, 20000);
          });

          batch.on('response', function (rets) {
            console.log('Batch Response:', rets);
            result = rets;
          });

          break;
        }
        case 'apexRestQuery': {
          const methodtype = queryOptions.methodtype;
          const path = queryOptions.path;
          const body = queryOptions.body ? queryOptions.body : {};

          try {
            switch (methodtype) {
              case 'get':
                response = await conn.apex.get(path);
                break;
              case 'post':
                response = await conn.apex.post(path, body);
                break;
              case 'patch':
                response = await conn.apex.patch(path, body);
                break;
              case 'put':
                response = await conn.apex.put(path, body);
                break;
              case 'delete':
                response = await conn.apex.del(path, body);
                break;
              default:
                throw new QueryError('Invalid HTTP method', 'Please specify a valid HTTP method', {});
            }
            result = response;
          } catch (error) {
            throw new QueryError('Apex REST API Error', error.message, {});
          }
          break;
        }
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }
    return {
      status: 'ok',
      data: result,
    };
  }

  authUrl(source_options): string {
    const client_id = source_options.client_id.value;
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;
    const client_secret = source_options.client_secret.value;
    const oauth2 = new jsforce.OAuth2({
      clientId: client_id,
      clientSecret: client_secret,
      redirectUri: redirectUri,
    });
    const authorizationUrl = oauth2.getAuthorizationUrl({
      scope: 'full',
    });
    return authorizationUrl;
  }
  async accessDetailsFrom(authCode: string, source_options): Promise<object> {
    let client_id = '';
    let client_secret = '';

    for (const item of source_options) {
      if (item.key === 'client_id') {
        client_id = item.value;
      }
      if (item.key === 'client_secret') {
        client_secret = item.value;
      }
    }

    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;
    const oauth2 = new jsforce.OAuth2({
      clientId: client_id,
      clientSecret: client_secret,
      redirectUri: redirectUri,
    });
    const conn = new jsforce.Connection({ oauth2: oauth2 });

    try {
      await conn.authorize(authCode);
    } catch (error) {
      throw new QueryError('Authorization Error', error.message, {});
    }

    const authDetails = [];
    if (conn['accessToken']) {
      authDetails.push(['access_token', conn['accessToken']]);
    }
    if (conn['refreshToken']) {
      authDetails.push(['refresh_token', conn['refreshToken']]);
    }
    if (conn['instanceUrl']) {
      authDetails.push(['instanceUrl', conn['instanceUrl']]);
    }
    return authDetails;
  }
}
