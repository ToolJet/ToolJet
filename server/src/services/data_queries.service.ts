import got from 'got';
import { QueryError } from '@tooljet/plugins/dist/server';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { DataQuery } from '../../src/entities/data_query.entity';
import { CredentialsService } from './credentials.service';
import { DataSource } from 'src/entities/data_source.entity';
import { DataSourcesService } from './data_sources.service';
import { PluginsHelper } from '../helpers/plugins.helper';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { EncryptionService } from './encryption.service';

@Injectable()
export class DataQueriesService {
  constructor(
    private readonly pluginsHelper: PluginsHelper,
    private credentialsService: CredentialsService,
    private dataSourcesService: DataSourcesService,
    private encryptionService: EncryptionService,
    @InjectRepository(DataQuery)
    private dataQueriesRepository: Repository<DataQuery>,
    @InjectRepository(OrgEnvironmentVariable)
    private orgEnvironmentVariablesRepository: Repository<OrgEnvironmentVariable>
  ) {}

  async findOne(dataQueryId: string): Promise<DataQuery> {
    return await this.dataQueriesRepository.findOne({
      where: { id: dataQueryId },
      relations: ['dataSource', 'plugin', 'app'],
    });
  }

  async all(user: User, query: object): Promise<DataQuery[]> {
    const { app_id: appId, app_version_id: appVersionId }: any = query;
    const whereClause = { appId, ...(appVersionId && { appVersionId }) };

    return await this.dataQueriesRepository.find({
      where: whereClause,
      order: { createdAt: 'DESC' }, // Latest query should be on top
      relations: ['plugin', 'plugin.iconFile', 'plugin.manifestFile'],
    });
  }

  async create(
    user: User,
    name: string,
    kind: string,
    options: object,
    appId: string,
    dataSourceId: string,
    appVersionId?: string, // TODO: Make this non optional when autosave is implemented
    pluginId?: string
  ): Promise<DataQuery> {
    const newDataQuery = this.dataQueriesRepository.create({
      name,
      kind,
      options,
      appId,
      dataSourceId,
      appVersionId,
      pluginId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.dataQueriesRepository.save(newDataQuery);
  }

  async delete(dataQueryId: string) {
    return await this.dataQueriesRepository.delete(dataQueryId);
  }

  async update(user: User, dataQueryId: string, name: string, options: object): Promise<DataQuery> {
    const dataQuery = this.dataQueriesRepository.save({
      id: dataQueryId,
      name,
      options,
      updatedAt: new Date(),
    });

    return dataQuery;
  }

  async fetchServiceAndParsedParams(dataSource, dataQuery, queryOptions, organization_id) {
    const sourceOptions = await this.parseSourceOptions(dataSource.options);
    const parsedQueryOptions = await this.parseQueryOptions(dataQuery.options, queryOptions, organization_id);
    const kind = dataQuery.kind;
    const service = await this.pluginsHelper.getService(dataQuery.pluginId, kind);

    return { service, sourceOptions, parsedQueryOptions };
  }

  private getCurrentUserToken = (isMultiAuthEnabled: boolean, tokenData: any, userId: string, isAppPublic: boolean) => {
    if (isMultiAuthEnabled) {
      if (!tokenData || !Array.isArray(tokenData)) return null;
      return !isAppPublic
        ? tokenData.find((token: any) => token.user_id === userId)
        : userId
        ? tokenData.find((token: any) => token.user_id === userId)
        : tokenData[0];
    } else {
      return tokenData;
    }
  };

  async runQuery(user: User, dataQuery: any, queryOptions: object): Promise<object> {
    const dataSource = dataQuery.dataSource?.id ? dataQuery.dataSource : {};
    const app = dataQuery?.app;
    const organizationId = user ? user.organizationId : app.organizationId;
    let { sourceOptions, parsedQueryOptions, service } = await this.fetchServiceAndParsedParams(
      dataSource,
      dataQuery,
      queryOptions,
      organizationId
    );

    try {
      // multi-auth will not work with public apps
      if (app?.isPublic && sourceOptions['multiple_auth_enabled']) {
        throw new QueryError('Authentication required for all users should be turned off', '', {});
      }
      return await service.run(sourceOptions, parsedQueryOptions, dataSource.id, dataSource.updatedAt, {
        user: { id: user?.id },
        app: { id: app?.id, isPublic: app?.isPublic },
      });
    } catch (api_error) {
      if (api_error.constructor.name === 'OAuthUnauthorizedClientError') {
        const currentUserToken = sourceOptions['refresh_token']
          ? sourceOptions
          : this.getCurrentUserToken(
              sourceOptions['multiple_auth_enabled'],
              sourceOptions['tokenData'],
              user?.id,
              app?.isPublic
            );
        if (currentUserToken && currentUserToken['refresh_token']) {
          console.log('Access token expired. Attempting refresh token flow.');
          let accessTokenDetails;
          try {
            accessTokenDetails = await service.refreshToken(sourceOptions, dataSource.id, user?.id, app?.isPublic);
          } catch (error) {
            if (error.constructor.name === 'OAuthUnauthorizedClientError') {
              // unauthorized error need to re-authenticate
              return {
                status: 'needs_oauth',
                data: { auth_url: this.dataSourcesService.getAuthUrl(dataSource.kind, sourceOptions).url },
              };
            }
            throw new QueryError(
              `API Error: ${api_error.message}. Refresh Token Error: ${error.message}`,
              `API Error: ${api_error.description}. Refresh Token Error: ${error.description}`,
              {
                requestObject: { api: api_error.data?.requestObject, refresh_token: error.data?.requestObject },
                responseObject: { api: api_error.data?.responseObject, refresh_token: error.data?.responseObject },
                responseHeaders: { api: api_error.data?.responseHeaders, refresh_token: error.data?.responseHeaders },
              }
            );
          }

          await this.dataSourcesService.updateOAuthAccessToken(
            accessTokenDetails,
            dataSource.options,
            dataSource.id,
            user?.id
          );
          await dataSource.reload();

          ({ sourceOptions, parsedQueryOptions, service } = await this.fetchServiceAndParsedParams(
            dataSource,
            dataQuery,
            queryOptions,
            organizationId
          ));

          return await service.run(sourceOptions, parsedQueryOptions, dataSource.id, dataSource.updatedAt, {
            user: { id: user?.id },
            app: { id: app?.id, isPublic: app?.isPublic },
          });
        } else if (dataSource.kind === 'restapi') {
          return {
            status: 'needs_oauth',
            data: { auth_url: this.dataSourcesService.getAuthUrl(dataSource.kind, sourceOptions).url },
          };
        } else {
          throw api_error;
        }
      } else {
        throw api_error;
      }
    }
  }

  checkIfContentTypeIsURLenc(headers: [] = []) {
    const objectHeaders = Object.fromEntries(headers);
    const contentType = objectHeaders['content-type'] ?? objectHeaders['Content-Type'];
    return contentType === 'application/x-www-form-urlencoded';
  }

  private sanitizeCustomParams(customArray: any) {
    const params = Object.fromEntries(customArray ?? []);
    Object.keys(params).forEach((key) => (params[key] === '' ? delete params[key] : {}));
    return params;
  }

  /* This function fetches the access token from the token url set in REST API (oauth) datasource */
  async fetchOAuthToken(sourceOptions: any, code: string, userId: any, isMultiAuthEnabled: boolean): Promise<any> {
    const tooljetHost = process.env.TOOLJET_HOST;
    const isUrlEncoded = this.checkIfContentTypeIsURLenc(sourceOptions['access_token_custom_headers']);
    const accessTokenUrl = sourceOptions['access_token_url'];

    const customParams = this.sanitizeCustomParams(sourceOptions['custom_auth_params']);
    const customAccessTokenHeaders = this.sanitizeCustomParams(sourceOptions['access_token_custom_headers']);

    const bodyData = {
      code,
      client_id: sourceOptions['client_id'],
      client_secret: sourceOptions['client_secret'],
      grant_type: sourceOptions['grant_type'],
      redirect_uri: `${tooljetHost}/oauth2/authorize`,
      ...customParams,
    };
    try {
      const response = await got(accessTokenUrl, {
        method: 'post',
        headers: {
          'Content-Type': isUrlEncoded ? 'application/x-www-form-urlencoded' : 'application/json',
          ...customAccessTokenHeaders,
        },
        form: isUrlEncoded ? bodyData : undefined,
        json: !isUrlEncoded ? bodyData : undefined,
      });

      const result = JSON.parse(response.body);
      return {
        ...(isMultiAuthEnabled ? { user_id: userId } : {}),
        access_token: result['access_token'],
        refresh_token: result['refresh_token'],
      };
    } catch (err) {
      throw new BadRequestException(this.parseErrorResponse(err?.response?.body, err?.response?.statusCode));
    }
  }

  private parseErrorResponse(error = 'unknown error', statusCode?: number): any {
    let errorObj = {};
    try {
      errorObj = JSON.parse(error);
    } catch (err) {
      errorObj['error_details'] = error;
    }

    errorObj['status_code'] = statusCode;
    return JSON.stringify(errorObj);
  }

  private getCurrentToken = (isMultiAuthEnabled: boolean, tokenData: any, newToken: any, userId: string) => {
    if (isMultiAuthEnabled) {
      let tokensArray = [];
      if (tokenData && Array.isArray(tokenData)) {
        let isExisted = false;
        const newTokenData = tokenData.map((token) => {
          if (token.user_id === userId) {
            isExisted = true;
            return { ...token, ...newToken };
          }
          return token;
        });
        if (isExisted) {
          tokensArray = newTokenData;
        } else {
          tokensArray = [...tokenData, newToken];
        }
      } else {
        tokensArray.push(newToken);
      }
      return tokensArray;
    } else {
      return newToken;
    }
  };

  /* This function fetches access token from authorization code */
  async authorizeOauth2(dataSource: DataSource, code: string, userId: string): Promise<any> {
    const sourceOptions = await this.parseSourceOptions(dataSource.options);
    const isMultiAuthEnabled = dataSource.options['multiple_auth_enabled']?.value;
    const newToken = await this.fetchOAuthToken(sourceOptions, code, userId, isMultiAuthEnabled);
    const tokenData = this.getCurrentToken(
      isMultiAuthEnabled,
      dataSource.options['tokenData']?.value,
      newToken,
      userId
    );

    const tokenOptions = [
      {
        key: 'tokenData',
        value: tokenData,
        encrypted: false,
      },
    ];

    return await this.dataSourcesService.updateOptions(dataSource.id, tokenOptions);
  }

  async parseSourceOptions(options: any): Promise<object> {
    // For adhoc queries such as REST API queries, source options will be null
    if (!options) return {};

    const parsedOptions = {};

    for (const key of Object.keys(options)) {
      const option = options[key];
      const encrypted = option['encrypted'];
      if (encrypted) {
        const credentialId = option['credential_id'];
        const value = await this.credentialsService.getValue(credentialId);
        parsedOptions[key] = value;
      } else {
        parsedOptions[key] = option['value'];
      }
    }

    return parsedOptions;
  }

  async resolveVariable(str: string, organization_id: string) {
    const tempStr: string = str.replace(/%%/g, '');
    let result = tempStr;
    if (new RegExp('^server.[A-Za-z0-9]+$').test(tempStr)) {
      const splitArray = tempStr.split('.');
      const variableResult = await this.orgEnvironmentVariablesRepository.findOne({
        variableType: 'server',
        organizationId: organization_id,
        variableName: splitArray[splitArray.length - 1],
      });

      if (variableResult) {
        result = await this.encryptionService.decryptColumnValue(
          'org_environment_variables',
          organization_id,
          variableResult.value
        );
      }
    }
    return result;
  }

  async parseQueryOptions(object: any, options: object, organization_id: string): Promise<object> {
    if (typeof object === 'object' && object !== null) {
      for (const key of Object.keys(object)) {
        object[key] = await this.parseQueryOptions(object[key], options, organization_id);
      }
      return object;
    } else if (typeof object === 'string') {
      object = object.replace(/\n/g, ' ');
      if (object.startsWith('{{') && object.endsWith('}}') && (object.match(/{{/g) || []).length === 1) {
        object = options[object];
        return object;
      } else if (object.match(/\{\{(.*?)\}\}/g)?.length > 0) {
        const variables = object.match(/\{\{(.*?)\}\}/g);

        if (variables?.length > 0) {
          for (const variable of variables) {
            object = object.replace(variable, options[variable]);
          }
        }
        return object;
      } else {
        if (object.startsWith('%%') && object.endsWith('%%') && (object.match(/%%/g) || []).length === 2) {
          if (object.includes(`server.`)) {
            object = await this.resolveVariable(object, organization_id);
          } else {
            object = options[object];
          }
          return object;
        } else {
          const variables = object.match(/%%(.*?)%%/g);

          if (variables?.length > 0) {
            for (const variable of variables) {
              if (variable.includes(`server.`)) {
                const secret_value = await this.resolveVariable(variable, organization_id);
                object = object.replace(variable, secret_value);
              } else {
                object = object.replace(variable, options[variable]);
              }
            }
          }
          return object;
        }
      }
    } else if (Array.isArray(object)) {
      object.forEach((element) => {});

      for (const [index, element] of object) {
        object[index] = await this.parseQueryOptions(element, options, organization_id);
      }
      return object;
    }
    return object;
  }
}
