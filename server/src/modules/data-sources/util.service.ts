import { DataSource } from '@entities/data_source.entity';
import { BadRequestException, Injectable, NotAcceptableException, NotImplementedException } from '@nestjs/common';
import * as protobuf from 'protobufjs';
import got from 'got';
import { CreateArgumentsDto, GetDataSourceOauthUrlDto, TestDataSourceDto } from './dto';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { User } from '@entities/user.entity';
import { DataSourceScopes, DataSourceTypes } from './constants';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { CredentialsService } from '@modules/encryption/services/credentials.service';
import { DataSourcesRepository } from './repository';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { cleanObject } from '@helpers/utils.helper';
import { decode } from 'js-base64';
import allPlugins from '@tooljet/plugins/dist/server';
import { EncryptionService } from '@modules/encryption/service';
import { OrganizationConstantType } from '@modules/organization-constants/constants';
import { PluginsServiceSelector } from './services/plugin-selector.service';
import { OrganizationConstantsUtilService } from '@modules/organization-constants/util.service';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { IDataSourcesUtilService } from './interfaces/IUtilService';

@Injectable()
export class DataSourcesUtilService implements IDataSourcesUtilService {
  constructor(
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly credentialService: CredentialsService,
    protected readonly dataSourceRepository: DataSourcesRepository,
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly encryptionService: EncryptionService,
    protected readonly pluginsServiceSelector: PluginsServiceSelector,
    protected readonly organizationConstantsUtilService: OrganizationConstantsUtilService
  ) {}
  async create(createArgumentsDto: CreateArgumentsDto, user: User): Promise<DataSource> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const newDataSource = manager.create(DataSource, {
        name: createArgumentsDto.name,
        kind: createArgumentsDto.kind,
        pluginId: createArgumentsDto.pluginId,
        organizationId: user.organizationId,
        scope: DataSourceScopes.GLOBAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const dataSource = await manager.save(newDataSource);

      // Creating empty options mapping
      await this.createDataSourceInAllEnvironments(user.organizationId, dataSource.id, manager);

      // Find the environment to be updated
      const envToUpdate = await this.appEnvironmentUtilService.get(
        user.organizationId,
        createArgumentsDto.environmentId,
        false,
        manager
      );
      await this.appEnvironmentUtilService.updateOptions(
        await this.parseOptionsForCreate(createArgumentsDto.options, false, manager),
        envToUpdate.id,
        dataSource.id,
        manager
      );
      // Find other environments to be updated
      const allEnvs = await this.appEnvironmentUtilService.getAll(user.organizationId, null, manager);

      if (allEnvs?.length) {
        const envsToUpdate = allEnvs.filter((env) => env.id !== envToUpdate.id);
        await Promise.all(
          envsToUpdate?.map(async (env) => {
            await this.appEnvironmentUtilService.updateOptions(
              await this.parseOptionsForCreate(createArgumentsDto.options, true, manager),
              env.id,
              dataSource.id,
              manager
            );
          })
        );
      }
      return dataSource;
    });
  }

  getServiceAndRpcNames(protoDefinition) {
    const root = protobuf.parse(protoDefinition).root;
    const serviceNamesAndMethods = root.nestedArray
      .filter((item): item is protobuf.Service => item instanceof protobuf.Service)
      .reduce((acc, service) => {
        const rpcMethods = service.methodsArray.map((method) => method.name);
        acc[service.name] = rpcMethods;
        return acc;
      }, {});
    return serviceNamesAndMethods;
  }

  // IMPORTANT: Should not do any changes on this function. Its used in migrations
  async parseOptionsForCreate(options: Array<object>, resetSecureData = false, manager?: EntityManager) {
    if (!options) return {};
    return await dbTransactionWrap(async (entityManager: EntityManager) => {
      const optionsWithOauth = await this.parseOptionsForOauthDataSource(options, resetSecureData);
      const parsedOptions = {};

      for (const option of optionsWithOauth) {
        if (option['encrypted']) {
          const credential = await this.credentialService.create(
            resetSecureData ? '' : option['value'] || '',
            entityManager
          );

          parsedOptions[option['key']] = {
            credential_id: credential.id,
            encrypted: option['encrypted'],
          };
        } else {
          parsedOptions[option['key']] = {
            value: option['value'],
            encrypted: false,
          };
        }
      }

      return parsedOptions;
    }, manager);
  }

  async parseOptionsForOauthDataSource(options: Array<object>, resetSecureData = false) {
    const findOption = (opts: any[], key: string) => opts.find((opt) => opt['key'] === key);

    if (findOption(options, 'oauth2') && findOption(options, 'code')) {
      const provider = findOption(options, 'provider')['value'];
      const authCode = findOption(options, 'code')['value'];
      const pluginIdOption = findOption(options, 'plugin_id');
      const plugin_id = pluginIdOption ? pluginIdOption['value'] : null;
      const queryService = await this.pluginsServiceSelector.getService(plugin_id, provider);

      // const queryService = new allPlugins[provider]();
      const accessDetails = await queryService.accessDetailsFrom(authCode, options, resetSecureData);

      for (const row of accessDetails) {
        const option = {};
        option['key'] = row[0];
        option['value'] = row[1];
        option['encrypted'] = true;

        options.push(option);
      }

      options = options.filter((option) => !['provider', 'code', 'oauth2'].includes(option['key']));
    }

    return options;
  }

  async update(
    dataSourceId: string,
    organizationId: string,
    name: string,
    options: Array<object>,
    environmentId?: string
  ): Promise<void> {
    const dataSource = await this.dataSourceRepository.findById(dataSourceId);

    if (dataSource.type === DataSourceTypes.SAMPLE) {
      throw new BadRequestException('Cannot update configuration of sample data source');
    }

    await dbTransactionWrap(async (manager: EntityManager) => {
      const isMultiEnvEnabled = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT);
      const envToUpdate = await this.appEnvironmentUtilService.get(organizationId, environmentId, false, manager);

      // if datasource is restapi then reset the token data
      if (dataSource.kind === 'restapi')
        options.push({
          key: 'tokenData',
          value: undefined,
          encrypted: false,
        });

      if (isMultiEnvEnabled) {
        dataSource.options = (
          await this.appEnvironmentUtilService.getOptions(dataSourceId, organizationId, envToUpdate.id)
        ).options;

        const newOptions = await this.parseOptionsForUpdate(dataSource, options, manager);
        await this.appEnvironmentUtilService.updateOptions(newOptions, envToUpdate.id, dataSource.id, manager);
      } else {
        const allEnvs = await this.appEnvironmentUtilService.getAll(organizationId);
        /* 
          Basic plan customer. lets update all environment options. 
          this will help us to run the queries successfully when the user buys enterprise plan 
          */

        const newOptions = await this.parseOptionsForUpdate(dataSource, options, manager);
        for (const env of allEnvs) {
          dataSource.options = (
            await this.appEnvironmentUtilService.getOptions(dataSourceId, organizationId, env.id)
          ).options;

          await this.appEnvironmentUtilService.updateOptions(newOptions, env.id, dataSource.id, manager);
        }
      }
      const updatableParams = {
        id: dataSourceId,
        name,
        updatedAt: new Date(),
      };

      // Remove keys with undefined values
      cleanObject(updatableParams);

      await manager.save(DataSource, updatableParams);
    });
  }

  async parseOptionsForUpdate(dataSource: DataSource, options: Array<object>, manager: EntityManager) {
    if (!options) return {};

    const optionsWithOauth = await this.parseOptionsForOauthDataSource(options);
    const parsedOptions = {};
    return await dbTransactionWrap(async (entityManager: EntityManager) => {
      for (const option of optionsWithOauth) {
        if (option['encrypted']) {
          const existingCredentialId =
            dataSource?.options &&
            dataSource.options[option['key']] &&
            dataSource.options[option['key']]['credential_id'];

          if (existingCredentialId) {
            (option['value'] || option['value'] === '') &&
              (await this.credentialService.update(existingCredentialId, option['value'] || ''));

            parsedOptions[option['key']] = {
              credential_id: existingCredentialId,
              encrypted: option['encrypted'],
            };
          } else {
            const credential = await this.credentialService.create(option['value'] || '', entityManager);

            parsedOptions[option['key']] = {
              credential_id: credential.id,
              encrypted: option['encrypted'],
            };
          }
        } else {
          parsedOptions[option['key']] = {
            value: option['value'],
            encrypted: false,
          };
        }
      }

      return parsedOptions;
    }, manager);
  }

  async findOneByEnvironment(
    dataSourceId: string,
    organizationId: string,
    environmentId?: string
  ): Promise<DataSource> {
    const dataSource = await this.dataSourceRepository.findOneOrFail({
      where: { id: dataSourceId, organizationId },
      relations: [
        'apps',
        'dataSourceOptions',
        'appVersion',
        'appVersion.app',
        'plugin',
        'plugin.iconFile',
        'plugin.manifestFile',
        'plugin.operationsFile',
      ],
    });

    if (!environmentId && dataSource.dataSourceOptions?.length > 1) {
      //fix for env id issue when importing cloud/enterprise apps to CE
      if (dataSource.dataSourceOptions?.length > 1) {
        const env = await this.appEnvironmentUtilService.get(organizationId, null);
        environmentId = env?.id;
      } else {
        throw new NotAcceptableException('Environment id should not be empty');
      }
    }

    if (dataSource.pluginId) {
      dataSource.plugin.iconFile.data = dataSource.plugin.iconFile.data.toString('utf8');
      dataSource.plugin.manifestFile.data = JSON.parse(decode(dataSource.plugin.manifestFile.data.toString('utf8')));
      dataSource.plugin.operationsFile.data = JSON.parse(
        decode(dataSource.plugin.operationsFile.data.toString('utf8'))
      );
    }

    if (environmentId) {
      dataSource.options = (
        await this.appEnvironmentUtilService.getOptions(dataSourceId, organizationId, environmentId)
      ).options;
    } else {
      dataSource.options = dataSource.dataSourceOptions?.[0]?.options || {};
    }
    return dataSource;
  }

  async resolveConstants(str: string, organizationId: string, environmentId: string): Promise<string> {
    const regex = /\{\{(constants|secrets)\.(.*?)\}\}/g;
    const matches = Array.from(str.matchAll(regex));

    if (matches.length === 0) return str;

    const replacements = await Promise.all(
      matches.map(async ([fullMatch, prefix, key]) => {
        if (prefix !== 'constants' && prefix !== 'secrets') return fullMatch;

        const type = prefix === 'constants' ? OrganizationConstantType.GLOBAL : OrganizationConstantType.SECRET;

        try {
          const constant = await this.organizationConstantsUtilService.getOrgEnvironmentConstant(
            key,
            organizationId,
            environmentId,
            type
          );

          if (!constant) return fullMatch;

          return await this.encryptionService.decryptColumnValue(
            'org_environment_constant_values',
            organizationId,
            constant.value
          );
        } catch (error) {
          console.error(`Error resolving constant ${key}:`, error);
          return fullMatch;
        }
      })
    );

    let result = str;
    for (let i = 0; i < matches.length; i++) {
      result = result.replace(matches[i][0], replacements[i]);
    }

    return result;
  }

  async resolveKeyValuePair(arr, organization_id, environment_id) {
    const resolvedArray = await Promise.all(
      arr.map((item) => this.resolveValue(item, organization_id, environment_id))
    );

    return resolvedArray;
  }

  async resolveValue(value, organization_id, environment_id) {
    const constantMatcher = /{{constants|secrets\..+?}}/g;

    if (typeof value === 'string' && constantMatcher.test(value)) {
      return await this.resolveConstants(value, organization_id, environment_id);
    }

    // Return the value as is if no match is found or if it's not a string
    return value;
  }

  async testConnection(testDataSourceDto: TestDataSourceDto, organization_id: string): Promise<object> {
    const { kind, options, plugin_id, environment_id } = testDataSourceDto;

    let result = {};

    const parsedOptions = JSON.parse(JSON.stringify(options));

    // need to match if currentOption is a contant, {{constants.psql_db}
    const constantMatcher = /{{constants|secrets\..+?}}/g;

    for (const key of Object.keys(parsedOptions)) {
      let currentOption = parsedOptions[key]?.['value'];

      if (Array.isArray(currentOption)) {
        // Resolve each element in the array
        currentOption = await Promise.all(
          currentOption.map((element) => this.resolveKeyValuePair(element, organization_id, environment_id))
        );
      } else {
        // Resolve single value
        currentOption = await this.resolveValue(currentOption, organization_id, environment_id);
      }

      // Update the parsedOptions with the resolved value(s)
      parsedOptions[key]['value'] = currentOption;
    }

    try {
      const sourceOptions = {};

      for (const key of Object.keys(parsedOptions)) {
        const credentialId = parsedOptions[key]?.['credential_id'];
        if (credentialId) {
          const encryptedKeyValue = await this.credentialService.getValue(credentialId);

          //check if encrypted key value is a constant
          if (constantMatcher.test(encryptedKeyValue)) {
            const resolved = await this.resolveConstants(encryptedKeyValue, organization_id, environment_id);
            sourceOptions[key] = resolved;
          } else {
            sourceOptions[key] = encryptedKeyValue;
          }
        } else {
          sourceOptions[key] = parsedOptions[key]['value'];
        }
      }

      const service = await this.pluginsServiceSelector.getService(plugin_id, kind);
      if (!service?.testConnection) {
        throw new NotImplementedException('testConnection method not implemented');
      }
      result = await service.testConnection(sourceOptions);
    } catch (error) {
      result = {
        status: 'failed',
        message: error.message,
      };
    }

    return result;
  }

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
    await this.updateOptions(dataSource.id, tokenOptions, organizationId, environmentId);
    return;
  }

  protected async updateOptions(
    dataSourceId: string,
    optionsToMerge: any,
    organizationId: string,
    environmentId?: string
  ): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const dataSource = await this.findOneByEnvironment(dataSourceId, environmentId);
      const parsedOptions = await this.parseOptionsForUpdate(dataSource, optionsToMerge, manager);
      const envToUpdate = await this.appEnvironmentUtilService.get(organizationId, environmentId, false, manager);
      const oldOptions = dataSource.options || {};
      const updatedOptions = { ...oldOptions, ...parsedOptions };
      const isMultiEnvEnabled = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT);

      if (isMultiEnvEnabled) {
        await this.appEnvironmentUtilService.updateOptions(updatedOptions, envToUpdate.id, dataSourceId, manager);
      } else {
        const allEnvs = await this.appEnvironmentUtilService.getAll(organizationId);
        await Promise.all(
          allEnvs.map(async (envToUpdate) => {
            await this.appEnvironmentUtilService.updateOptions(updatedOptions, envToUpdate.id, dataSourceId, manager);
          })
        );
      }
    });
  }

  protected getCurrentToken(isMultiAuthEnabled: boolean, tokenData: any, newToken: any, userId: string) {
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
  }

  protected checkIfContentTypeIsURLenc(headers: [] = []) {
    const objectHeaders = Object.fromEntries(headers);
    const contentType = objectHeaders['content-type'] ?? objectHeaders['Content-Type'];
    return contentType === 'application/x-www-form-urlencoded';
  }

  protected sanitizeCustomParams(customArray: any) {
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

  protected parseErrorResponse(error = 'unknown error', statusCode?: number): any {
    let errorObj = {};
    try {
      errorObj = JSON.parse(error);
    } catch (err) {
      errorObj['error_details'] = error;
    }

    errorObj['status_code'] = statusCode;
    return JSON.stringify(errorObj);
  }

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

  async parseSourceOptions(options: any, organizationId: string, environmentId: string): Promise<object> {
    // For adhoc queries such as REST API queries, source options will be null
    if (!options) return {};
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
                const resolved = await this.resolveConstants(inner, organizationId, environmentId);
                curr[j] = resolved;
              }
            }
          }
        }
      }

      if (constantMatcher.test(currentOption)) {
        const resolved = await this.resolveConstants(currentOption, organizationId, environmentId);
        options[key]['value'] = resolved;
      }
    }

    const parsedOptions = {};

    for (const key of Object.keys(options)) {
      const option = options[key];
      const encrypted = option['encrypted'];
      if (encrypted) {
        const credentialId = option['credential_id'];
        const value = await this.credentialService.getValue(credentialId);

        if (value.includes('{{constants') || value.includes('{{secrets')) {
          const resolved = await this.resolveConstants(value, organizationId, environmentId);
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

  protected changeCurrentToken(tokenData: any, userId: string, accessTokenDetails: any, isMultiAuthEnabled: boolean) {
    if (isMultiAuthEnabled) {
      return tokenData?.value.map((token: any) => {
        if (token.user_id === userId) {
          return { ...token, ...accessTokenDetails };
        }
        return token;
      });
    } else {
      return accessTokenDetails;
    }
  }

  async updateOAuthAccessToken(
    accessTokenDetails: object,
    dataSourceOptions: object,
    dataSourceId: string,
    userId: string,
    organizationId: string,
    environmentId?: string
  ) {
    const existingAccessTokenCredentialId =
      dataSourceOptions['access_token'] && dataSourceOptions['access_token']['credential_id'];
    const existingRefreshTokenCredentialId =
      dataSourceOptions['refresh_token'] && dataSourceOptions['refresh_token']['credential_id'];
    if (existingAccessTokenCredentialId) {
      await this.credentialService.update(existingAccessTokenCredentialId, accessTokenDetails['access_token']);

      existingRefreshTokenCredentialId &&
        accessTokenDetails['refresh_token'] &&
        (await this.credentialService.update(existingRefreshTokenCredentialId, accessTokenDetails['refresh_token']));
    } else if (dataSourceId) {
      const isMultiAuthEnabled = dataSourceOptions['multiple_auth_enabled']?.value;
      const updatedTokenData = this.changeCurrentToken(
        dataSourceOptions['tokenData'],
        userId,
        accessTokenDetails,
        isMultiAuthEnabled
      );
      const tokenOptions = [
        {
          key: 'tokenData',
          value: updatedTokenData,
          encrypted: false,
        },
      ];
      await this.updateOptions(dataSourceId, tokenOptions, organizationId, environmentId);
    }
  }

  async findDefaultDataSource(
    kind: string,
    appVersionId: string,
    organizationId: string,
    manager: EntityManager
  ): Promise<DataSource> {
    const defaultDataSource = await manager.findOne(DataSource, {
      where: { kind, appVersionId, type: DataSourceTypes.STATIC },
    });

    if (defaultDataSource) {
      return defaultDataSource;
    }
    const dataSource = await this.dataSourceRepository.createDefaultDataSource(kind, appVersionId, manager);
    await this.createDataSourceInAllEnvironments(organizationId, dataSource.id, manager);
    return dataSource;
  }

  async getAuthUrl(getDataSourceOauthUrlDto: GetDataSourceOauthUrlDto): Promise<{ url: string }> {
    const { provider, source_options = {}, plugin_id = null } = getDataSourceOauthUrlDto;
    const service = await this.pluginsServiceSelector.getService(plugin_id, provider);
    return { url: service.authUrl(source_options) };
  }

  async createDataSourceInAllEnvironments(
    organizationId: string,
    dataSourceId: string,
    manager?: EntityManager
  ): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const allEnvs = await this.appEnvironmentUtilService.getAllEnvironments(organizationId, manager);
      await Promise.all(
        allEnvs.map((env) => {
          const options = manager.create(DataSourceOptions, {
            environmentId: env.id,
            dataSourceId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          return manager.save(options);
        })
      );
    }, manager);
  }
}
