import * as requestIp from 'request-ip';
import { App } from '@entities/app.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { User } from '@entities/user.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { VersionRepository } from '@modules/versions/repository';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueryError } from '@tooljet/plugins';
import { EntityManager } from 'typeorm';
import { CookieOptions, Response } from 'express';
import { DataSource } from '@entities/data_source.entity';
import { DataSourcesUtilService } from '@modules/data-sources/util.service';
import { PluginsServiceSelector } from '@modules/data-sources/services/plugin-selector.service';
import { IDataQueriesUtilService } from './interfaces/IUtilService';
import { RequestContext } from '@modules/request-context/service';
import { DataQueryStatus } from './services/status.service';

@Injectable()
export class DataQueriesUtilService implements IDataQueriesUtilService {
  constructor(
    protected readonly versionRepository: VersionRepository,
    protected readonly configService: ConfigService,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly dataSourceUtilService: DataSourcesUtilService,
    protected readonly pluginsSelectorService: PluginsServiceSelector
  ) {}
  async validateQueryActionsAgainstEnvironment(organizationId: string, appVersionId: string, errorMessage: string) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      if (appVersionId) {
        const environmentsCount = await manager.count(AppEnvironment, {
          where: {
            organizationId,
          },
        });
        const currentEnvironment = await manager
          .createQueryBuilder('app_versions', 'av')
          .select('ae.*')
          .innerJoin('app_environments', 'ae', 'av.current_environment_id = ae.id')
          .where('av.id = :id', { id: appVersionId })
          .getRawOne();
        //TODO: Remove this once the currentEnvironment nul intermittent issue is complexly fixed.
        if (!currentEnvironment) {
          const appVersion = await this.versionRepository.findOne({
            where: {
              id: appVersionId,
            },
          });
          console.log('ERROR_CURRENT_ENVIRONMENT_NULL_FOR_QUERY_CREATION', appVersion);
        }
        const isPromotedVersion = environmentsCount > 1 && currentEnvironment && currentEnvironment?.priority !== 1;
        if (isPromotedVersion) {
          throw new BadRequestException(errorMessage);
        }
      }
    });
  }

  async runQuery(
    user: User,
    dataQuery: any,
    queryOptions: object,
    response: Response,
    environmentId?: string
  ): Promise<object> {
    let result;
    const queryStatus = new DataQueryStatus();
    const forwardRestCookies = this.configService.get<string>('FORWARD_RESTAPI_COOKIES') === 'true';

    try {
      const dataSource: DataSource = dataQuery?.dataSource;

      const app: App = dataQuery?.app;
      if (!(dataSource && app)) {
        throw new UnauthorizedException();
      }
      const organizationId = user ? user.organizationId : app.organizationId;

      const dataSourceOptions = await this.appEnvironmentUtilService.getOptions(
        dataSource.id,
        organizationId,
        environmentId
      );
      dataSource.options = dataSourceOptions.options;

      let { sourceOptions, parsedQueryOptions, service } = await this.fetchServiceAndParsedParams(
        dataSource,
        dataQuery,
        queryOptions,
        organizationId,
        environmentId,
        user
      );

      queryStatus.setOptions(parsedQueryOptions);

      try {
        // multi-auth will not work with public apps
        if (app?.isPublic && sourceOptions['multiple_auth_enabled']) {
          throw new QueryError(
            'Authentication required for all users should be turned off since the app is public',
            '',
            {}
          );
        }

        if (dataSource.kind === 'restapi') {
          const customXFFHeader = ['tj-x-forwarded-for'];
          if (RequestContext?.currentContext?.req) {
            customXFFHeader.push(requestIp.getClientIp(RequestContext?.currentContext?.req));
          }
          if (!sourceOptions['headers']) {
            sourceOptions['headers'] = [customXFFHeader];
          } else {
            sourceOptions['headers'].push(customXFFHeader);
          }
          if (forwardRestCookies) {
            // Extract cookies from the client request
            const cookies = RequestContext?.currentContext?.req?.headers?.cookie || '';
            if (cookies) {
              const cookieArray = cookies.split('; ');
              //Filter out tooljet sensitive tokens
              const filteredCookies = cookieArray.filter((cookie) => !cookie.startsWith('tj_auth_token='));
              const filteredCookiesString = filteredCookies.join('; ');
              if (filteredCookiesString) {
                const cookieHeader = ['Cookie', filteredCookiesString];
                sourceOptions['headers'].push(cookieHeader);
              }
            }
          }
        }

        queryStatus.setStart();

        result = await service.run(
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
                queryStatus.setSuccess('needs_oauth');
                const result = await this.dataSourceUtilService.getAuthUrl({
                  provider: dataSource.kind,
                  source_options: sourceOptions,
                  plugin_id: undefined,
                });
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

            await this.dataSourceUtilService.updateOAuthAccessToken(
              accessTokenDetails,
              dataSource.options,
              dataSource.id,
              user?.id,
              user?.organizationId,
              environmentId
            );
            const dataSourceOptions = await this.appEnvironmentUtilService.getOptions(
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
              environmentId,
              user
            ));
            queryStatus.setOptions(parsedQueryOptions);
            result = await service.run(
              sourceOptions,
              parsedQueryOptions,
              `${dataSource.id}-${dataSourceOptions.environmentId}`,
              dataSourceOptions.updatedAt,
              {
                user: { id: user?.id },
                app: { id: app?.id, isPublic: app?.isPublic },
              }
            );
          } else if (
            dataSource.kind === 'restapi' ||
            dataSource.kind === 'openapi' ||
            dataSource.kind === 'graphql' ||
            dataSource.kind === 'googlesheets' ||
            dataSource.kind === 'slack' ||
            dataSource.kind === 'zendesk'
          ) {
            queryStatus.setSuccess('needs_oauth');
            const result = await this.dataSourceUtilService.getAuthUrl({
              provider: dataSource.kind,
              source_options: sourceOptions,
              plugin_id: undefined,
            });
            return {
              status: 'needs_oauth',
              data: {
                kind: dataSource.kind,
                options: {
                  access_type: sourceOptions['access_type'],
                },
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
      queryStatus.setSuccess();

      //TODO: support workflow execute method().
      if (forwardRestCookies && dataQuery.kind === 'restapi' && result.responseHeaders) {
        this.setCookiesBackToClient(response, result.responseHeaders);
      }
      return result;
    } catch (queryError) {
      queryStatus.setFailure({
        message: queryError?.message,
        description: queryError?.description,
        data: queryError?.data,
        stack: queryError?.stack,
      });
      throw queryError;
    } finally {
      if (user) {
        // this.eventEmitter.emit('auditLogEntry', {
        //   userId: user.id,
        //   organizationId: user.organizationId,
        //   resourceId: dataQuery?.id,
        //   resourceName: dataQuery?.name,
        //   resourceType: ResourceTypes.DATA_QUERY,
        //   actionType: ActionTypes.DATA_QUERY_RUN,
        //   metadata: queryStatus.getMetaData(),
        // });
      }
    }
  }

  async fetchServiceAndParsedParams(
    dataSource,
    dataQuery,
    queryOptions,
    organization_id,
    environmentId = undefined,
    user = undefined
  ) {
    const sourceOptions = await this.dataSourceUtilService.parseSourceOptions(
      dataSource.options,
      organization_id,
      environmentId,
      user
    );

    const parsedQueryOptions = await this.parseQueryOptions(
      dataQuery.options,
      queryOptions,
      organization_id,
      environmentId,
      user
    );

    const service = await this.pluginsSelectorService.getService(dataSource.pluginId, dataSource.kind);

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

  setCookiesBackToClient(response: Response, responseHeaders: any) {
    /* forward set-cookie headers */
    const setCookieHeaders = responseHeaders['set-cookie'];
    if (setCookieHeaders) {
      setCookieHeaders.forEach((cookie) => {
        const cookieParts = cookie.split(';');
        const cookieNameValue = cookieParts[0].split('=');
        const cookieOptions: CookieOptions = {};

        const keyMap: { [key: string]: keyof CookieOptions } = {
          'max-age': 'maxAge',
          expires: 'expires',
          httponly: 'httpOnly',
          secure: 'secure',
          domain: 'domain',
          path: 'path',
          encode: 'encode',
          samesite: 'sameSite',
          signed: 'signed',
        };

        cookieParts.slice(1).forEach((part) => {
          const [key, value] = part.trim().split('=');
          const normalizedKey = key.toLowerCase();

          if (key.toLowerCase() === 'expires') {
            const expiresTimestamp = new Date(value).getTime() - Date.now();
            cookieOptions.maxAge = expiresTimestamp;
          } else {
            if (keyMap[normalizedKey]) {
              const optionKey = keyMap[normalizedKey];
              cookieOptions[optionKey as any] = value || true;
            }
          }
        });

        response.cookie(cookieNameValue[0], cookieNameValue[1], cookieOptions);
      });
    }
  }

  async parseQueryOptions(
    object: any,
    options: object,
    organization_id: string,
    environmentId?: string,
    user?: User
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

        // a: Handle strings with both {{ }} and %% (%% - deprecated removed) TODO: CHECK IF ITS NEEDED
        if (typeof resolvedValue === 'string' && resolvedValue.includes('{{') && resolvedValue.includes('}}')) {
          const resolvedVar = options[resolvedValue];
          if (parent && key !== null) {
            parent[key] = resolvedVar;
          }
        }

        // b: Handle {{constants.}} or {{secrets.}}
        if (
          (typeof resolvedValue === 'string' && resolvedValue.includes('{{constants.')) ||
          resolvedValue.includes('{{secrets.') ||
          resolvedValue.includes('{{globals.server.')
        ) {
          const resolvingConstant = await this.dataSourceUtilService.resolveConstants(
            resolvedValue,
            organization_id,
            environmentId,
            user
          );
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
        // Removed code since variables are deprecated

        // f: Replace all %% variables
        //disallow strings with spaces in between '%%' eg. '%% hghgh hg %%'
        // Removed code since variables are deprecated
      }
    }

    return object;
  }
}
