import got from 'got';
import { QueryError } from '@tooljet/plugins/dist/server';
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { DataQuery } from '../../src/entities/data_query.entity';
import { CredentialsService } from './credentials.service';
import { DataSource } from 'src/entities/data_source.entity';
import { DataSourcesService } from './data_sources.service';
import { PluginsHelper } from '../helpers/plugins.helper';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { EncryptionService } from './encryption.service';
import { App } from 'src/entities/app.entity';
import { AppEnvironmentService } from './app_environments.service';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import allPlugins from '@tooljet/plugins/dist/server';
import { DataSourceScopes } from 'src/helpers/data_source.constants';
import { EventHandler } from 'src/entities/event_handler.entity';
import { IUpdatingReferencesOptions } from '@dto/data-query.dto';

@Injectable()
export class DataQueriesService {
  constructor(
    private readonly pluginsHelper: PluginsHelper,
    private credentialsService: CredentialsService,
    private dataSourcesService: DataSourcesService,
    private encryptionService: EncryptionService,
    private appEnvironmentService: AppEnvironmentService,
    @InjectRepository(DataQuery)
    private dataQueriesRepository: Repository<DataQuery>,
    @InjectRepository(OrgEnvironmentVariable)
    private orgEnvironmentVariablesRepository: Repository<OrgEnvironmentVariable>
  ) {}

  async findOne(dataQueryId: string): Promise<DataQuery> {
    return await this.dataQueriesRepository.findOne({
      where: { id: dataQueryId },
      relations: ['dataSource', 'apps', 'dataSource.apps', 'plugins'],
    });
  }

  async all(query: object): Promise<DataQuery[]> {
    const { app_version_id: appVersionId }: any = query;

    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager
        .createQueryBuilder(DataQuery, 'data_query')
        .innerJoinAndSelect('data_query.dataSource', 'data_source')
        .leftJoinAndSelect('data_query.plugins', 'plugins')
        .leftJoinAndSelect('plugins.iconFile', 'iconFile')
        .leftJoinAndSelect('plugins.manifestFile', 'manifestFile')
        .where('data_source.appVersionId = :appVersionId', { appVersionId })
        .where('data_query.app_version_id = :appVersionId', { appVersionId })
        .orderBy('data_query.updatedAt', 'DESC')
        .getMany();
    });
  }

  async create(
    name: string,
    options: object,
    dataSourceId: string,
    appVersionId: string,
    manager: EntityManager
  ): Promise<DataQuery> {
    const newDataQuery = manager.create(DataQuery, {
      name,
      options,
      dataSourceId,
      appVersionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return manager.save(newDataQuery);
  }

  async delete(dataQueryId: string) {
    await this.deleteDataQueryEvents(dataQueryId);

    return await this.dataQueriesRepository.delete(dataQueryId);
  }

  async deleteDataQueryEvents(dataQueryId: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const allEvents = await manager.find(EventHandler, {
        where: { sourceId: dataQueryId },
      });

      return await manager.remove(allEvents);
    });
  }

  async update(dataQueryId: string, name: string, options: object): Promise<DataQuery> {
    const dataQuery = this.dataQueriesRepository.save({
      id: dataQueryId,
      name,
      options,
      updatedAt: new Date(),
    });

    return dataQuery;
  }

  async bulkUpdateQueryOptions(dataQueriesOptions: IUpdatingReferencesOptions[]) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      for (const { id, options } of dataQueriesOptions) {
        await manager.save(DataQuery, {
          id,
          options,
          updatedAt: new Date(),
        });
      }

      return await manager
        .createQueryBuilder(DataQuery, 'data_query')
        .select(['id', 'options', 'updated_at'])
        .where('data_query.id IN (:...ids)', { ids: dataQueriesOptions.map((query) => query.id) })
        .execute();
    });
  }

  async fetchServiceAndParsedParams(dataSource, dataQuery, queryOptions, organization_id, environmentId = undefined) {
    const sourceOptions = await this.parseSourceOptions(dataSource.options, organization_id, environmentId);

    const parsedQueryOptions = await this.parseQueryOptions(
      dataQuery.options,
      queryOptions,
      organization_id,
      environmentId
    );

    const service = await this.pluginsHelper.getService(dataSource.pluginId, dataSource.kind);

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

  async runQuery(user: User, dataQuery: any, queryOptions: object, environmentId?: string): Promise<object> {
    const dataSource: DataSource = dataQuery?.dataSource;

    const app: App = dataQuery?.app;
    if (!(dataSource && app)) {
      throw new UnauthorizedException();
    }
    const organizationId = user ? user.organizationId : app.organizationId;

    const dataSourceOptions = await this.appEnvironmentService.getOptions(dataSource.id, organizationId, environmentId);
    dataSource.options = dataSourceOptions.options;

    let { sourceOptions, parsedQueryOptions, service } = await this.fetchServiceAndParsedParams(
      dataSource,
      dataQuery,
      queryOptions,
      organizationId,
      environmentId
    );

    try {
      // multi-auth will not work with public apps
      if (app?.isPublic && sourceOptions['multiple_auth_enabled']) {
        throw new QueryError(
          'Authentication required for all users should be turned off since the app is public',
          '',
          {}
        );
      }
      return await service.run(
        sourceOptions,
        parsedQueryOptions,
        `${dataSource.id}-${dataSourceOptions.environmentId}`,
        dataSourceOptions.updatedAt,
        {
          user: { id: user?.id },
          app: {
            id: app?.id,
            isPublic: app?.isPublic,
            ...(dataSource.kind === 'tooljetdb' && { organization_id: app.organizationId }),
          },
        }
      );
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
              const result = await this.dataSourcesService.getAuthUrl(dataSource.kind, sourceOptions);
              return {
                status: 'needs_oauth',
                data: {
                  auth_url: result.url,
                },
              };
            }
            throw new QueryError(
              `API Error: ${api_error.message}. Refresh Token Error: ${error.message}`,
              `API Error: ${api_error.description}. Refresh Token Error: ${error.description}`,
              {
                requestObject: {
                  api: api_error.data?.requestObject,
                  refresh_token: error.data?.requestObject,
                },
                responseObject: {
                  api: api_error.data?.responseObject,
                  refresh_token: error.data?.responseObject,
                },
                responseHeaders: {
                  api: api_error.data?.responseHeaders,
                  refresh_token: error.data?.responseHeaders,
                },
              }
            );
          }

          await this.dataSourcesService.updateOAuthAccessToken(
            accessTokenDetails,
            dataSource.options,
            dataSource.id,
            user?.id,
            user?.organizationId,
            environmentId
          );
          const dataSourceOptions = await this.appEnvironmentService.getOptions(
            dataSource.id,
            user.organizationId,
            environmentId
          );
          dataSource.options = dataSourceOptions.options;

          ({ sourceOptions, parsedQueryOptions, service } = await this.fetchServiceAndParsedParams(
            dataSource,
            dataQuery,
            queryOptions,
            organizationId,
            environmentId
          ));

          return await service.run(
            sourceOptions,
            parsedQueryOptions,
            `${dataSource.id}-${dataSourceOptions.environmentId}`,
            dataSourceOptions.updatedAt,
            {
              user: { id: user?.id },
              app: { id: app?.id, isPublic: app?.isPublic },
            }
          );
        } else if (dataSource.kind === 'restapi' || dataSource.kind === 'openapi' || dataSource.kind === 'graphql') {
          const result = await this.dataSourcesService.getAuthUrl(dataSource.kind, sourceOptions);
          return {
            status: 'needs_oauth',
            data: {
              auth_url: result.url,
            },
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

  /* this function only for getting auth token for googlesheets and related plugins*/
  async fetchAPITokenFromPlugins(dataSource: DataSource, code: string, sourceOptions: any) {
    const queryService = new allPlugins[dataSource.kind]();
    const accessDetails = await queryService.accessDetailsFrom(code, sourceOptions);
    const options = [];
    for (const row of accessDetails) {
      const option = {};
      option['key'] = row[0];
      option['value'] = row[1];
      option['encrypted'] = true;

      options.push(option);
    }
    return options;
  }

  /* This function fetches access token from authorization code */
  async authorizeOauth2(
    dataSource: DataSource,
    code: string,
    userId: string,
    environmentId?: string,
    organizationId?: string
  ): Promise<void> {
    const sourceOptions = await this.parseSourceOptions(dataSource.options, organizationId, environmentId);
    let tokenOptions: any;
    if (['googlesheets', 'slack', 'zendesk', 'salesforce'].includes(dataSource.kind)) {
      tokenOptions = await this.fetchAPITokenFromPlugins(dataSource, code, sourceOptions);
    } else {
      const isMultiAuthEnabled = dataSource.options['multiple_auth_enabled']?.value;
      const newToken = await this.fetchOAuthToken(sourceOptions, code, userId, isMultiAuthEnabled);
      const tokenData = this.getCurrentToken(
        isMultiAuthEnabled,
        dataSource.options['tokenData']?.value,
        newToken,
        userId
      );

      tokenOptions = [
        {
          key: 'tokenData',
          value: tokenData,
          encrypted: false,
        },
      ];
    }

    await this.dataSourcesService.updateOptions(dataSource.id, tokenOptions, organizationId, environmentId);
    return;
  }

  async parseSourceOptions(options: any, organization_id: string, environmentId: string): Promise<object> {
    // For adhoc queries such as REST API queries, source options will be null
    if (!options) return {};
    const variablesMatcher = /(%%.+?%%)/g;
    const constantMatcher = /\{\{(constants|secrets)\..*?\}\}/g;

    for (const key of Object.keys(options)) {
      const currentOption = options[key]?.['value'];

      //! request options are nested arrays with constants and variables
      if (Array.isArray(currentOption)) {
        for (let i = 0; i < currentOption.length; i++) {
          const curr = currentOption[i];

          if (Array.isArray(curr)) {
            for (let j = 0; j < curr.length; j++) {
              const inner = curr[j];
              constantMatcher.lastIndex = 0;

              if (constantMatcher.test(inner)) {
                const resolved = await this.resolveConstants(inner, organization_id, environmentId);
                curr[j] = resolved;
              }
            }
          }
        }
      }

      const matched = variablesMatcher.exec(currentOption);
      if (matched) {
        const resolved = await this.resolveVariable(currentOption, organization_id);

        options[key]['value'] = resolved;
      }

      if (constantMatcher.test(currentOption)) {
        const resolved = await this.resolveConstants(currentOption, organization_id, environmentId);
        options[key]['value'] = resolved;
      }
    }

    const parsedOptions = {};

    for (const key of Object.keys(options)) {
      const option = options[key];
      const encrypted = option['encrypted'];
      if (encrypted) {
        const credentialId = option['credential_id'];
        const value = await this.credentialsService.getValue(credentialId);

        if (value.includes('%%server')) {
          const resolved = await this.resolveVariable(value, organization_id);
          parsedOptions[key] = resolved;
          continue;
        } else if (value.includes('{{constants') || value.includes('{{secrets')) {
          const resolved = await this.resolveConstants(value, organization_id, environmentId);
          parsedOptions[key] = resolved;
          continue;
        } else {
          parsedOptions[key] = value;
        }
      } else {
        parsedOptions[key] = option['value'];
      }
    }

    return parsedOptions;
  }

  async resolveVariable(str: string, organization_id: string) {
    const tempStr: string = str.replace(/%%/g, '');
    let result = tempStr;

    const isServerVariable = new RegExp('^server').test(tempStr);
    const isClientVariable = new RegExp('^client').test(tempStr);

    if (isServerVariable || isClientVariable) {
      const splitArray = tempStr.split('.');
      const variableType = splitArray[0];
      const variableName = splitArray[splitArray.length - 1];

      const variableResult = await this.orgEnvironmentVariablesRepository.findOne({
        where: { variableType, organizationId: organization_id, variableName: variableName },
      });

      if (isClientVariable && variableResult) {
        result = variableResult.value;
      }

      if (isServerVariable && variableResult) {
        result = await this.encryptionService.decryptColumnValue(
          'org_environment_variables',
          organization_id,
          variableResult.value
        );
      }
    }

    return result;
  }

  async resolveConstants(str: string, organization_id: string, environmentId: string) {
    let finalResult = '';
    let lastIndex = 0;

    const regex = /\{\{((constants|secrets)\.(.*?))\}\}/g;
    let match;

    while ((match = regex.exec(str)) !== null) {
      const prefix = match[2];
      const key = match[3];

      finalResult += str.slice(lastIndex, match.index);

      if (prefix === 'constants' || prefix === 'secrets') {
        try {
          const constant = await this.appEnvironmentService.getOrgEnvironmentConstant(
            key,
            organization_id,
            environmentId
          );

          if (constant) {
            const decryptedValue = await this.encryptionService.decryptColumnValue(
              'org_environment_constant_values',
              organization_id,
              constant.value
            );
            finalResult += decryptedValue;
          } else {
            finalResult += match[0];
          }
        } catch (error) {
          finalResult += match[0];
        }
      } else {
        finalResult += match[0];
      }

      lastIndex = match.index + match[0].length;
    }

    finalResult += str.slice(lastIndex);
    return finalResult;
  }
  async parseQueryOptions(
    object: any,
    options: object,
    organization_id: string,
    environmentId?: string
  ): Promise<object> {
    const stack: any[] = [{ obj: object, key: null, parent: null }];
    while (stack.length > 0) {
      const { obj, key, parent } = stack.pop();
      // Case 1: Object
      if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        Object.keys(obj).forEach((k) => {
          stack.push({ obj: obj[k], key: k, parent: obj });
        });
        continue;
      }
      // Case 2: Array
      if (Array.isArray(obj)) {
        obj.forEach((element, index) => {
          stack.push({ obj: element, key: index, parent: obj });
        });
        continue;
      }
      // Case 3: String
      if (typeof obj === 'string') {
        let resolvedValue = obj.replace(/\n/g, ' ');
        // a: Handle strings with both {{ }} and %%
        if (
          typeof resolvedValue === 'string' &&
          resolvedValue.includes('{{') &&
          resolvedValue.includes('}}') &&
          resolvedValue?.includes('%%')
        ) {
          let resolvedVar = options[resolvedValue];
          // find all server variables in the string
          if (typeof resolvedValue === 'string' && resolvedValue.includes(`server.`)) {
            let serverVariables: string[] = resolvedValue.match(/server.(.*?)%%/g) || [];
            // Map each variable by replacing '%%' and 'server.'
            serverVariables = serverVariables?.map((variable) => {
              return variable.replace('%%', '').replace('server.', '');
            });
            const resolvedOrgVar: string[] = [];
            for (const variable of serverVariables || []) {
              const resolvedVariable = await this.resolveVariable(variable, organization_id);
              resolvedOrgVar.push(resolvedVariable);
            }
            serverVariables?.forEach((i) => {
              resolvedVar = resolvedVar.replace('HiddenEnvironmentVariable', resolvedOrgVar[i]);
            });
          }
          if (parent && key !== null) {
            parent[key] = resolvedVar;
          }
        }
        // b: Handle {{constants.}} or {{secrets.}}
        if (
          (typeof resolvedValue === 'string' && resolvedValue.includes('{{constants.')) ||
          resolvedValue.includes('{{secrets.')
        ) {
          const resolvingConstant = await this.resolveConstants(resolvedValue, organization_id, environmentId);
          resolvedValue = resolvingConstant;
          if (parent && key !== null) {
            parent[key] = resolvedValue;
          }
        }
        // c: Replace all occurrences of {{ }} variables
        if (
          typeof resolvedValue === 'string' &&
          resolvedValue?.match(/\{\{(.*?)\}\}/g)?.length > 0 &&
          !(resolvedValue.startsWith('{{') && resolvedValue.endsWith('}}'))
        ) {
          const variables = resolvedValue.match(/\{\{(.*?)\}\}/g);

          for (const variable of variables || []) {
            let replacement = options[variable];
            // Check if the replacement is an object
            if (typeof replacement === 'object' && replacement !== null) {
              // Ensure parent is a non-empty array before attempting to access its first element
              if (Array.isArray(parent) && parent.length > 0) {
                // Assign replacement value based on the first item in the parent array
                replacement = replacement[parent[0]] || replacement;
              }
            }
            // Check type of replacement and assign accordingly
            if (typeof replacement === 'string' || typeof replacement === 'number') {
              // If replacement is a string, perform the replace
              resolvedValue = resolvedValue.replace(variable, String(replacement));
            } else {
              // If replacement is an object or an array, assign the whole value to resolvedValue
              resolvedValue = resolvedValue.replace(variable, JSON.stringify(replacement));
            }
          }
          if (parent && key !== null) {
            parent[key] = resolvedValue;
          }
        }
        // d: Simple variable replacement for single {{variable}}
        if (
          typeof resolvedValue === 'string' &&
          resolvedValue.startsWith('{{') &&
          resolvedValue.endsWith('}}') &&
          (resolvedValue.match(/{{/g) || [])?.length === 1
        ) {
          resolvedValue = options[resolvedValue];
          if (parent && key !== null) {
            parent[key] = resolvedValue;
          }
        }
        // e: Handle strings with %%
        if (
          typeof resolvedValue === 'string' &&
          resolvedValue.startsWith('%%') &&
          resolvedValue.endsWith('%%') &&
          (resolvedValue.match(/%%/g) || [])?.length === 2
        ) {
          if (resolvedValue.includes(`server.`)) {
            resolvedValue = await this.resolveVariable(resolvedValue, organization_id);
          } else {
            resolvedValue = options[resolvedValue];
          }
          if (parent && key !== null) {
            parent[key] = resolvedValue;
          }
        }
        // f: Replace all %% variables
        //disallow strings with spaces in between '%%' eg. '%% hghgh hg %%'
        const variables = typeof resolvedValue === 'string' && resolvedValue?.match(/%%(?:client|server)\.[^\s%%]+%%/g);
        if (variables?.length > 0) {
          for (const variable of variables) {
            if (variable.includes(`server.`)) {
              const secretValue = await this.resolveVariable(variable, organization_id);
              resolvedValue = resolvedValue.replace(variable, secretValue);
            } else {
              resolvedValue = resolvedValue.replace(variable, options[variable]);
            }
          }
          if (parent && key !== null) {
            parent[key] = resolvedValue;
          }
        }
      }
    }
    return object;
  }

  async changeQueryDataSource(queryId: string, dataSourceId: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(DataQuery, {
        id: queryId,
        dataSourceId: dataSourceId,
        updatedAt: new Date(),
      });
    });
  }

  async getGlobalQueriesByAppVersion(appVersionId: string, manager: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager
        .createQueryBuilder(DataQuery, 'data_query')
        .leftJoinAndSelect('data_query.dataSource', 'dataSource')
        .where('data_query.appVersionId = :appVersionId', { appVersionId })
        .andWhere('dataSource.scope = :scope', { scope: DataSourceScopes.GLOBAL })
        .getMany();
    }, manager);
  }
}
