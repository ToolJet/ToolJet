import { DataSource } from '@entities/data_source.entity';
import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import * as protobuf from 'protobufjs';
import got from 'got';
import Ajv2020 from 'ajv/dist/2020';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import {
  CreateArgumentsDto,
  GetDataSourceOauthUrlDto,
  TestDataSourceDto,
  CreateOpenApiSpecDto,
  OpenApiSpecOperationsQueryDto,
} from './dto';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager, ILike, Repository } from 'typeorm';
import { User } from '@entities/user.entity';
import { DataSourceScopes, DataSourceTypes, RUNTIME_EXCLUDED_OPTION_KEYS } from './constants';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { CredentialsService } from '@modules/encryption/services/credentials.service';
import { DataSourcesRepository } from './repository';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { cleanObject, resolveOptionsArrayForOAuth, resolveSourceOptionsForOAuth } from '@helpers/utils.helper';
import { decode } from 'js-base64';
import { EncryptionService } from '@modules/encryption/service';
import { OrganizationConstantType } from '@modules/organization-constants/constants';
import { PluginsServiceSelector } from './services/plugin-selector.service';
import { OrganizationConstantsUtilService } from '@modules/organization-constants/util.service';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { IDataSourcesUtilService } from './interfaces/IUtilService';
import { InMemoryCacheService } from '@modules/inMemoryCache/in-memory-cache.service';
import { OpenApiSpecOperation } from '@entities/openapi_spec_operation.entity';
import { OpenApiSpecTerminationRegistry } from '@modules/openapi-spec/services/openapi-spec-termination-registry';
import { OpenApiSpecJobData } from '@modules/openapi-spec/processors/openapi-spec.processor';
import {
  OPENAPI_SPEC_OPTION_KEYS,
  OPENAPI_SPEC_PROCESSING_QUEUE,
  OpenApiSpecSourceType,
  OpenApiSpecStatus,
  PROCESS_OPENAPI_SPEC_JOB,
  OPENAPI_V2_DATASOURCE_KIND,
} from '@modules/openapi-spec/constants';

@Injectable()
export class DataSourcesUtilService implements IDataSourcesUtilService {
  constructor(
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly credentialService: CredentialsService,
    protected readonly dataSourceRepository: DataSourcesRepository,
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly encryptionService: EncryptionService,
    protected readonly pluginsServiceSelector: PluginsServiceSelector,
    protected readonly organizationConstantsUtilService: OrganizationConstantsUtilService,
    protected readonly inMemoryCacheService: InMemoryCacheService,
    @InjectQueue(OPENAPI_SPEC_PROCESSING_QUEUE) protected readonly openApiSpecQueue: Queue,
    @InjectRepository(OpenApiSpecOperation)
    protected readonly openApiSpecOperationsRepository: Repository<OpenApiSpecOperation>,
    protected readonly openApiSpecTerminationRegistry: OpenApiSpecTerminationRegistry
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
          if (option['workspace_constant']) {
            const credential = await this.credentialService.create(option['workspace_constant'], entityManager);

            parsedOptions[option['key']] = {
              credential_id: credential.id,
              workspace_constant: option['workspace_constant'],
              encrypted: option['encrypted'],
            };
          } else {
            const credential = await this.credentialService.create(
              resetSecureData ? '' : option['value'] || '',
              entityManager
            );

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

  async parseOptionsForOauthDataSource(
    options: Array<object>,
    resetSecureData = false,
    userId?: string,
    organizationId?: string,
    environmentId?: string
  ) {
    const findOption = (opts: any[], key: string) => opts.find((opt) => opt['key'] === key);

    if (findOption(options, 'oauth2') && findOption(options, 'code')) {
      const provider = findOption(options, 'provider')['value'];
      const authCode = findOption(options, 'code')['value'];
      const pluginIdOption = findOption(options, 'plugin_id');
      const plugin_id = pluginIdOption ? pluginIdOption['value'] : null;
      const queryService = await this.pluginsServiceSelector.getService(plugin_id, provider);

      // const queryService = new allPlugins[provider]();

      // Resolve workspace constants in options before calling accessDetailsFrom
      let resolvedOptions = options;
      if (organizationId && environmentId) {
        resolvedOptions = await resolveOptionsArrayForOAuth(options, (value) =>
          this.resolveConstants(value, organizationId, environmentId)
        );
      }

      let accessDetailsPromise: Promise<any>;

      const cacheKey = `${provider}_${authCode}`;

      if (this.inMemoryCacheService.has(cacheKey)) {
        accessDetailsPromise = this.inMemoryCacheService.get(cacheKey);
      } else {
        accessDetailsPromise = queryService.accessDetailsFrom(authCode, resolvedOptions, resetSecureData);
        this.inMemoryCacheService.set(cacheKey, accessDetailsPromise);
      }
      const accessDetails = await accessDetailsPromise;

      const isMultiAuthEnabled = findOption(options, 'multiple_auth_enabled')?.['value'];
      if (isMultiAuthEnabled) {
        const newTokenDataObj = { user_id: userId };
        for (const [key, value] of accessDetails) {
          newTokenDataObj[key] = value;
        }
        const existingTokenArray = findOption(options, 'token_data')?.['value'];

        const updatedTokenData = this.getCurrentToken(isMultiAuthEnabled, existingTokenArray, newTokenDataObj, userId);
        options = options.filter((option) => !['provider', 'code', 'oauth2'].includes(option['key']));

        options.push({
          key: 'tokenData',
          value: updatedTokenData,
          encrypted: false,
        });
        return options;
      } else {
        for (const row of accessDetails) {
          const option = {};
          option['key'] = row[0];
          option['value'] = row[1];
          option['encrypted'] = true;

          options.push(option);
        }
      }

      options = options.filter((option) => !['provider', 'code', 'oauth2'].includes(option['key']));
    }

    return options;
  }

  async update(
    dataSourceId: string,
    organizationId: string,
    userId: string,
    name: string,
    options: Array<object>,
    environmentId?: string
  ): Promise<void> {
    const dataSource = await this.dataSourceRepository.findById(dataSourceId, organizationId);

    if (dataSource.type === DataSourceTypes.SAMPLE) {
      throw new BadRequestException('Cannot update configuration of sample data source');
    }

    try {
      await dbTransactionWrap(async (manager: EntityManager) => {
        const isMultiEnvEnabled = await this.licenseTermsService.getLicenseTerms(
          LICENSE_FIELD.MULTI_ENVIRONMENT,
          organizationId
        );
        const envToUpdate = await this.appEnvironmentUtilService.get(organizationId, environmentId, false, manager);
        // if datasource is restapi then reset the token data
        if (['restapi', 'microsoft_graph'].includes(dataSource.kind))
          options.push({
            key: 'tokenData',
            value: undefined,
            encrypted: false,
          });

        if (isMultiEnvEnabled) {
          dataSource.options = (
            await this.appEnvironmentUtilService.getOptions(dataSourceId, organizationId, envToUpdate.id)
          ).options;

          const newOptions = await this.parseOptionsForUpdate(
            dataSource,
            options,
            manager,
            userId,
            organizationId,
            envToUpdate.id
          );
          await this.appEnvironmentUtilService.updateOptions(newOptions, envToUpdate.id, dataSource.id, manager);
        } else {
          const allEnvs = await this.appEnvironmentUtilService.getAll(organizationId);
          /* 
            Basic plan customer. lets update all environment options. 
            this will help us to run the queries successfully when the user buys enterprise plan 
            */

          for (const env of allEnvs) {
            dataSource.options = (
              await this.appEnvironmentUtilService.getOptions(dataSourceId, organizationId, env.id)
            ).options;
            const newOptions = await this.parseOptionsForUpdate(
              dataSource,
              options,
              manager,
              userId,
              organizationId,
              env.id
            );
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
    } finally {
      // Defensive: reported as "this.inMemoryCacheService.clear is not a function" on save,
      // despite the constructor wiring, compiled dist output, and decorator metadata all
      // checking out correctly on inspection - root cause unconfirmed. Guarded so a datasource
      // save can never 500 on cache invalidation; worst case is a stale OAuth cache entry.
      this.inMemoryCacheService?.clear?.();
    }
  }

  async validateOptions(
    dataSourceId: string,
    organizationId: string,
    environmentId: string,
    options: Record<string, any>,
    schema: Record<string, any>
  ): Promise<{ valid: boolean; errors: any[] }> {
    const dataSource = await this.findOneByEnvironment(dataSourceId, environmentId, organizationId);
    const storedOptions: Record<string, any> = dataSource.options || {};

    // Convert options to plain data, decrypting only credential_ids that
    // belong to this datasource (prevents cross-datasource credential reads).
    const data: Record<string, any> = {};
    for (const [key, value] of Object.entries(options)) {
      if (value?.credential_id) {
        const stored = storedOptions[key];
        if (stored?.credential_id === value.credential_id) {
          const decrypted = await this.credentialService.getValue(value.credential_id);
          if (decrypted !== undefined && decrypted !== null && decrypted !== '') {
            data[key] = decrypted;
          }
        }
      } else if (value?.value !== undefined && value?.value !== null && value?.value !== '') {
        data[key] = value.value;
      }
    }

    const ajv = new Ajv2020({
      strict: false,
      allErrors: true,
      removeAdditional: false,
      validateSchema: false,
      coerceTypes: true,
    });
    const validate = ajv.compile(schema);
    const valid = validate(data);
    return { valid: !!valid, errors: validate.errors || [] };
  }

  async parseOptionsForUpdate(
    dataSource: DataSource,
    options: Array<object>,
    manager: EntityManager,
    userId?: string,
    organizationId?: string,
    environmentId?: string
  ) {
    if (!options) return {};

    const resolvedOptions = [];
    for (const option of options) {
      if (option['encrypted'] && !option['value'] && dataSource?.options?.[option['key']]?.credential_id) {
        try {
          const value = await this.credentialService.getValue(dataSource.options[option['key']].credential_id);
          resolvedOptions.push({ ...option, value });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          resolvedOptions.push(option);
        }
      } else {
        resolvedOptions.push(option);
      }
    }

    const optionsWithOauth = await this.parseOptionsForOauthDataSource(
      resolvedOptions,
      false,
      userId,
      organizationId,
      environmentId
    );
    const parsedOptions = {};
    const isOpenApiV2DataSource = dataSource?.kind === OPENAPI_V2_DATASOURCE_KIND;
    const openApiSpecOptionKeys: string[] = isOpenApiV2DataSource ? Object.values(OPENAPI_SPEC_OPTION_KEYS) : [];

    if (dataSource?.options) {
      for (const key in dataSource.options) {
        if (dataSource.options[key]?.workspace_constant) {
          parsedOptions[key] = {
            workspace_constant: dataSource.options[key].workspace_constant,
            credential_id: dataSource.options[key].credential_id,
            encrypted: dataSource.options[key].encrypted,
          };
        } else if (openApiSpecOptionKeys.includes(key)) {
          // OpenAPI v2 bookkeeping (spec_metadata, spec_status, raw_spec, etc.) is written by
          // the background worker, never by this form - it has no corresponding submitted
          // `option` below, so without this it gets silently dropped on every ordinary save.
          parsedOptions[key] = dataSource.options[key];
        }
      }
    }

    return await dbTransactionWrap(async (entityManager: EntityManager) => {
      for (const option of optionsWithOauth) {
        const key = option['key'];
        const credentialValue = option['value'];

        if (option['encrypted']) {
          const existingCredentialId =
            dataSource?.options && dataSource.options[key] && dataSource.options[key]['credential_id'];

          if (credentialValue && (credentialValue.includes('{{constants') || credentialValue.includes('{{secrets'))) {
            if (!parsedOptions[key]) {
              parsedOptions[key] = {};
            }
            parsedOptions[key].workspace_constant = credentialValue;
          } else {
            if (
              existingCredentialId &&
              credentialValue !== undefined &&
              credentialValue !== (await this.credentialService.getValue(existingCredentialId))
            ) {
              if (parsedOptions[key]) {
                delete parsedOptions[key].workspace_constant;
              }
            }
          }

          if (existingCredentialId) {
            if (credentialValue !== undefined) {
              await this.credentialService.update(existingCredentialId, credentialValue || '');
            }

            if (!parsedOptions[key]) {
              parsedOptions[key] = {};
            }
            parsedOptions[key].credential_id = existingCredentialId;
            parsedOptions[key].encrypted = option['encrypted'];
          } else {
            const credential = await this.credentialService.create(credentialValue || '', entityManager);

            if (!parsedOptions[key]) {
              parsedOptions[key] = {};
            }
            parsedOptions[key].credential_id = credential.id;
            parsedOptions[key].encrypted = option['encrypted'];
          }
        } else {
          parsedOptions[key] = {
            value: credentialValue,
            encrypted: false,
          };
        }
      }

      return parsedOptions;
    }, manager);
  }

  async findAllByOrganization(organizationId: string): Promise<Pick<DataSource, 'id' | 'name' | 'kind'>[]> {
    return this.dataSourceRepository.find({
      where: { organizationId },
      select: ['id', 'name', 'kind'],
    });
  }

  async findOneWithName(name: string, organizationId: string): Promise<DataSource> {
    return this.dataSourceRepository.findOneOrFail({
      where: { name: ILike(name), organizationId },
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
  }

  async findOneByEnvironment(
    dataSourceId: string,
    environmentId: string,
    organizationId?: string
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

  async resolveConstants(str: string, organizationId: string, environmentId: string, user?: User): Promise<string> {
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
    if (!Array.isArray(arr)) {
      return this.resolveValue(arr, organization_id, environment_id);
    }

    return Promise.all(arr.map((item) => this.resolveValue(item, organization_id, environment_id)));
  }

  async resolveValue(value, organization_id, environment_id) {
    const constantMatcher = /{{constants|secrets|globals.server\..+?}}/g;

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
    const constantMatcher = /{{constants|secrets|globals.server\..+?}}/g;

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
          constantMatcher.lastIndex = 0;

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
        message: `${error.message}${error?.description ? `: ${error.description}` : ''}
        ${error?.data ? ` - ${JSON.stringify(error.data)}` : ''}`,
      };
    }

    return result;
  }

  /* Handle auth flow starting from Querymanager */
  async authorizeOauth2(
    dataSource: DataSource,
    code: string,
    userId: string,
    environmentId?: string,
    organizationId?: string
  ): Promise<void> {
    const sourceOptions = await this.parseSourceOptions(dataSource.options, organizationId, environmentId);
    let tokenOptions: any;
    const isMultiAuthEnabled = dataSource.options['multiple_auth_enabled']?.value;
    if (
      [
        'googlesheets',
        'slack',
        'zendesk',
        'salesforce',
        'googlecalendar',
        'snowflake',
        'microsoft_graph',
        'hubspot',
        'xero',
        'bigquery',
        'databricks',
        'asana',
      ].includes(dataSource.kind)
    ) {
      const newTokenData = await this.fetchAPITokenFromPlugins(
        dataSource,
        code,
        sourceOptions,
        isMultiAuthEnabled,
        userId
      );
      if (isMultiAuthEnabled) {
        const updatedTokenData = this.getCurrentToken(
          isMultiAuthEnabled,
          dataSource.options['tokenData']?.value,
          newTokenData,
          userId
        );
        tokenOptions = [
          {
            key: 'tokenData',
            value: updatedTokenData,
            encrypted: false,
          },
        ];
      } else {
        tokenOptions = newTokenData;
      }
    } else {
      const newToken = await this.fetchOAuthToken(sourceOptions, code, userId, isMultiAuthEnabled, dataSource);
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
      const dataSource = await this.findOneByEnvironment(dataSourceId, environmentId, organizationId);
      const parsedOptions = await this.parseOptionsForUpdate(dataSource, optionsToMerge, manager);
      const envToUpdate = await this.appEnvironmentUtilService.get(organizationId, environmentId, false, manager);
      const oldOptions = dataSource.options || {};
      const updatedOptions = { ...oldOptions, ...parsedOptions };
      const isMultiEnvEnabled = await this.licenseTermsService.getLicenseTerms(
        LICENSE_FIELD.MULTI_ENVIRONMENT,
        organizationId
      );

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

  private fetchEnvVariables(pluginKind: string, keyAppend: string): string {
    const dataSourcePrefix = {
      googlecalendar: 'GOOGLE',
      gmail: 'GOOGLE',
      snowflake: 'SNOWFLAKE',
      microsoft_graph: 'MICROSFT',
      hubspot: 'HUBSPOT',
    };
    const key = dataSourcePrefix[pluginKind] + '_' + keyAppend;
    return key;
  }

  /* This function fetches the access token from the token url set in REST API (oauth) datasource */
  async fetchOAuthToken(
    sourceOptions: any,
    code: string,
    userId: any,
    isMultiAuthEnabled: boolean,
    dataSource: DataSource
  ): Promise<any> {
    const tooljetHost = process.env.TOOLJET_HOST;
    const accessTokenUrl = sourceOptions['access_token_url'];
    if (sourceOptions['oauth_type'] === 'tooljet_app') {
      const clientIdKey = this.fetchEnvVariables(dataSource.kind, 'CLIENT_ID');
      const clientSecretKey = this.fetchEnvVariables(dataSource.kind, 'CLIENT_SECRET');
      sourceOptions['client_id'] = process.env[sourceOptions[clientIdKey]];
      sourceOptions['client_secret'] = process.env[sourceOptions[clientSecretKey]];
    }

    if (!accessTokenUrl) {
      throw new BadRequestException('Missing access_token_url');
    }
    if (!sourceOptions['client_id']) {
      throw new BadRequestException('Missing client_id');
    }
    const customParams = this.sanitizeCustomParams(sourceOptions['custom_auth_params']);
    const customAccessTokenHeaders = this.sanitizeCustomParams(sourceOptions['access_token_custom_headers']);

    const baseBodyData = {
      code,
      grant_type: sourceOptions['grant_type'],
      redirect_uri: `${tooljetHost}/oauth2/authorize`,
      ...customParams,
    };

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...customAccessTokenHeaders,
    };

    let bodyData;
    if (sourceOptions.client_auth?.toLowerCase() === 'header') {
      const credentials = Buffer.from(`${sourceOptions['client_id']}:${sourceOptions['client_secret']}`).toString(
        'base64'
      );
      headers['Authorization'] = `Basic ${credentials}`;
      bodyData = baseBodyData;
    } else {
      bodyData = {
        ...baseBodyData,
        client_id: sourceOptions['client_id'],
        client_secret: sourceOptions['client_secret'],
      };
    }

    try {
      const response = await got(accessTokenUrl, {
        method: 'post',
        headers,
        form: bodyData,
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
    } catch (error) {
      errorObj['error_details'] = error;
    }

    errorObj['status_code'] = statusCode;
    return JSON.stringify(errorObj);
  }

  /* This function fetches auth token only for OAuth plugins */
  async fetchAPITokenFromPlugins(
    dataSource: DataSource,
    code: string,
    sourceOptions: any,
    isMultiAuthEnabled: boolean,
    userId: string
  ) {
    const queryService = await this.pluginsServiceSelector.getService(dataSource.pluginId, dataSource.kind);
    const accessDetails = await queryService.accessDetailsFrom(code, sourceOptions);
    const options = [];

    if (isMultiAuthEnabled) {
      const tokenObject = { user_id: userId };
      for (const [key, value] of accessDetails) {
        tokenObject[key] = value;
      }
      return tokenObject;
    } else {
      for (const row of accessDetails) {
        const option = {};
        option['key'] = row[0];
        option['value'] = row[1];
        option['encrypted'] = true;

        options.push(option);
      }
      return options;
    }
  }

  async parseSourceOptions(options: any, organizationId: string, environmentId: string, user?: User): Promise<object> {
    // For adhoc queries such as REST API queries, source options will be null
    if (!options) return {};
    const constantMatcher = /\{\{(constants|secrets|globals.server)\..*?\}\}/g;

    for (const key of Object.keys(options)) {
      // OpenAPI v2: raw_spec/spec_metadata/etc. are worker-managed bookkeeping, never read by run() -
      // skip them so query runs never dereference, decrypt, or constant-resolve the spec.
      if (RUNTIME_EXCLUDED_OPTION_KEYS.includes(key)) continue;

      const currentOption = options[key]?.['value'];
      constantMatcher.lastIndex = 0;

      //! request options are nested arrays with constants and variables
      if (Array.isArray(currentOption)) {
        for (let i = 0; i < currentOption.length; i++) {
          const curr = currentOption[i];
          // Handle nested arrays (like [['', '']])
          if (Array.isArray(curr)) {
            for (let j = 0; j < curr.length; j++) {
              const inner = curr[j];
              constantMatcher.lastIndex = 0;

              if (constantMatcher.test(inner)) {
                const resolved = await this.resolveConstants(inner, organizationId, environmentId, user);
                curr[j] = resolved;
              }
            }
          } else if (typeof curr === 'object' && curr !== null) {
            // Handle nested objects in arrays (specifically for Openapi)
            for (const objKey of Object.keys(curr)) {
              const objValue = curr[objKey];
              constantMatcher.lastIndex = 0;

              if (constantMatcher.test(objValue)) {
                const resolved = await this.resolveConstants(objValue, organizationId, environmentId, user);
                curr[objKey] = resolved;
              }
            }
          }
        }
      }

      if (constantMatcher.test(currentOption)) {
        const resolved = await this.resolveConstants(currentOption, organizationId, environmentId, user);
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
          const resolved = await this.resolveConstants(value, organizationId, environmentId, user);
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

      if (existingRefreshTokenCredentialId && accessTokenDetails['refresh_token']) {
        await this.credentialService.update(existingRefreshTokenCredentialId, accessTokenDetails['refresh_token']);
      }
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

  async getAuthUrl(getDataSourceOauthUrlDto: GetDataSourceOauthUrlDto): Promise<{ url: string }> {
    const {
      provider,
      source_options = {},
      plugin_id = null,
      environment_id,
      organization_id,
    } = getDataSourceOauthUrlDto;
    const service = await this.pluginsServiceSelector.getService(plugin_id || null, provider);

    if (organization_id && environment_id) {
      const resolvedSourceOptions = await resolveSourceOptionsForOAuth(source_options, (value) =>
        this.resolveConstants(value, organization_id, environment_id)
      );
      return { url: service.authUrl(resolvedSourceOptions) };
    }

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

  // --- OpenAPI v2 spec processing -------------------------------------------------------
  // Kept on DataSourcesUtilService (rather than a separate service) so the existing
  // FeatureAbilityGuard/ValidateDataSourceGuard stack on DataSourcesController applies to
  // these routes for free, and because this is fundamentally a datasource concern.

  async createOrReplaceOpenApiSpec(dataSourceId: string, organizationId: string, dto: CreateOpenApiSpecDto) {
    const batches = await this.resolveOpenApiSpecEnvironmentBatches(organizationId, dto.environmentId);
    const rawSpec = dto.sourceType === OpenApiSpecSourceType.URL ? null : dto.definition;

    const jobs = await Promise.all(
      batches.map(async (environmentIds) => {
        for (const environmentId of environmentIds) {
          await this.writeOpenApiSpecOptions(dataSourceId, organizationId, environmentId, {
            [OPENAPI_SPEC_OPTION_KEYS.SOURCE_TYPE]: dto.sourceType,
            [OPENAPI_SPEC_OPTION_KEYS.URL]: dto.url || null,
            [OPENAPI_SPEC_OPTION_KEYS.RAW_SPEC]: rawSpec,
            [OPENAPI_SPEC_OPTION_KEYS.STATUS]: OpenApiSpecStatus.PENDING,
            [OPENAPI_SPEC_OPTION_KEYS.ERROR]: null,
          });
        }

        const jobData: OpenApiSpecJobData = {
          dataSourceId,
          organizationId,
          environmentIds,
          sourceType: dto.sourceType,
          url: dto.url,
          definition: dto.definition,
        };
        const job = await this.openApiSpecQueue.add(PROCESS_OPENAPI_SPEC_JOB, jobData);

        for (const environmentId of environmentIds) {
          await this.writeOpenApiSpecOptions(dataSourceId, organizationId, environmentId, {
            [OPENAPI_SPEC_OPTION_KEYS.JOB_ID]: job.id,
            [OPENAPI_SPEC_OPTION_KEYS.STATUS]: OpenApiSpecStatus.PROCESSING,
          });
        }

        return { jobId: job.id, environmentIds };
      })
    );

    return { status: OpenApiSpecStatus.PROCESSING, jobs };
  }

  async getOpenApiSpecStatus(
    dataSourceId: string,
    organizationId: string,
    environmentId: string
  ): Promise<{ status: OpenApiSpecStatus | null; error: string | null }> {
    const options = await this.getResolvedOpenApiSpecOptions(dataSourceId, organizationId, environmentId);
    return {
      status: options[OPENAPI_SPEC_OPTION_KEYS.STATUS]?.value || null,
      error: options[OPENAPI_SPEC_OPTION_KEYS.ERROR]?.value || null,
    };
  }

  async getOpenApiSpecMetadata(dataSourceId: string, organizationId: string, environmentId: string) {
    const options = await this.getResolvedOpenApiSpecOptions(dataSourceId, organizationId, environmentId);
    return options[OPENAPI_SPEC_OPTION_KEYS.METADATA]?.value || null;
  }

  async cancelOpenApiSpecProcessing(dataSourceId: string, organizationId: string, environmentId: string) {
    const options = await this.getResolvedOpenApiSpecOptions(dataSourceId, organizationId, environmentId);
    const jobId = options[OPENAPI_SPEC_OPTION_KEYS.JOB_ID]?.value;

    await this.openApiSpecTerminationRegistry.requestTermination(dataSourceId, environmentId);

    if (jobId) {
      const job = await this.openApiSpecQueue.getJob(jobId);
      // Only waiting/delayed jobs can be removed outright; an active job is left to observe
      // the termination flag cooperatively (see OpenApiSpecProcessor).
      if (job && ['waiting', 'delayed'].includes(await job.getState())) {
        await job.remove();
      }
    }

    await this.writeOpenApiSpecOptions(dataSourceId, organizationId, environmentId, {
      [OPENAPI_SPEC_OPTION_KEYS.STATUS]: OpenApiSpecStatus.CANCELLED,
    });

    return { status: OpenApiSpecStatus.CANCELLED };
  }

  // Called before deleting an openapiv2 datasource - delete itself isn't environment-scoped, so
  // this checks every environment's DataSourceOptions row for that datasource (a job can be
  // in flight per environment independently) and, for any still PENDING/PROCESSING, requests
  // termination and WAITS for confirmation (unlike cancelOpenApiSpecProcessing, which is
  // fire-and-forget) - deleting while a job may still be mid-transaction, writing to
  // openapi_spec_operations for a datasource whose row is about to disappear, risks exactly the
  // interleaved/corrupted-write scenario OpenApiSpecTerminationRegistry exists to prevent.
  // Throws (via terminateAndWait) if a job doesn't stop within its timeout - the caller should
  // let that propagate and refuse the delete rather than proceeding regardless.
  async terminateOpenApiSpecJobsForDelete(dataSourceId: string): Promise<void> {
    const allOptions = await dbTransactionWrap((manager: EntityManager) =>
      manager.find(DataSourceOptions, { where: { dataSourceId } })
    );

    for (const options of allOptions) {
      const status = options.options?.[OPENAPI_SPEC_OPTION_KEYS.STATUS]?.value;
      if (![OpenApiSpecStatus.PENDING, OpenApiSpecStatus.PROCESSING].includes(status)) continue;

      const jobId = options.options?.[OPENAPI_SPEC_OPTION_KEYS.JOB_ID]?.value;
      await this.openApiSpecTerminationRegistry.terminateAndWait(dataSourceId, options.environmentId, jobId);
    }
  }

  // openapi_spec_operations is the sole source of truth for per-operation data - the processor
  // no longer builds/stores a duplicate lightweight index in spec_metadata, so this queries the
  // table directly instead of reading a JSON blob off DataSourceOptions. Only lightweight
  // columns are selected (parameters/requestBodySchema/responseSchemas stay off this list,
  // fetched only via getOpenApiSpecOperation's single-record lookup below).
  async listOpenApiSpecOperations(
    dataSourceId: string,
    organizationId: string,
    environmentId: string,
    query: OpenApiSpecOperationsQueryDto
  ) {
    const currentPage = parseInt(query.page) || 1;
    const perPage = parseInt(query.perPage) || 1000;

    const qb = this.openApiSpecOperationsRepository
      .createQueryBuilder('operation')
      .select([
        'operation.id',
        'operation.operationId',
        'operation.serviceId',
        'operation.path',
        'operation.method',
        'operation.name',
        'operation.deprecated',
        'operation.tags',
        'operation.security',
        'operation.hasRequestBody',
      ])
      .where('operation.dataSourceId = :dataSourceId', { dataSourceId })
      .andWhere('operation.environmentId = :environmentId', { environmentId });

    if (query.service) {
      qb.andWhere('operation.serviceId = :service', { service: query.service });
    }
    if (query.tag) {
      // tags is a jsonb array column - `?` is Postgres's jsonb "does this array contain this
      // string" containment operator.
      qb.andWhere('operation.tags ? :tag', { tag: query.tag });
    }
    if (query.search) {
      // tags::text casts the jsonb array to its text representation (e.g. ["billing","v2"]) so
      // ILIKE can substring-match within it - covers path/name/tag with the one search box.
      qb.andWhere(
        '(operation.name ILIKE :search OR operation.path ILIKE :search OR operation.tags::text ILIKE :search)',
        {
          search: `%${query.search}%`,
        }
      );
    }

    const [operations, totalCount] = await qb
      .orderBy('operation.path', 'ASC')
      .addOrderBy('operation.method', 'ASC')
      .skip((currentPage - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return {
      meta: {
        totalPages: Math.max(Math.ceil(totalCount / perPage), 1),
        totalCount,
        currentPage,
      },
      operations,
    };
  }

  // Looked up by the row's own `id`, not operationId - operationId is optional in the spec
  // (and not unique-constrained even when present), so it can't serve as the reference key.
  // The frontend gets `id` from listOpenApiSpecOperations, which queries this same table.
  async getOpenApiSpecOperation(dataSourceId: string, environmentId: string, id: string) {
    const operation = await this.openApiSpecOperationsRepository.findOne({
      where: { dataSourceId, environmentId, id },
    });
    if (!operation) throw new NotFoundException(`Operation '${id}' not found`);
    return operation;
  }

  // Licensing-aware fan-out:
  //  - multi-env licensed + specific environmentId requested -> single batch of one environment
  //  - multi-env licensed + no environmentId ("all environments") -> N independent batches (jobs),
  //    one per environment, so one broken URL/spec doesn't block the others
  //  - multi-env not licensed -> a single batch containing every environment row, processed once
  //    and duplicated across all of them (mirrors this service's own duplication behaviour for
  //    ordinary data_source_options when unlicensed - see createDataSourceInAllEnvironments)
  private async resolveOpenApiSpecEnvironmentBatches(
    organizationId: string,
    requestedEnvironmentId?: string
  ): Promise<string[][]> {
    const isMultiEnvEnabled = await this.licenseTermsService.getLicenseTerms(
      LICENSE_FIELD.MULTI_ENVIRONMENT,
      organizationId
    );
    const environments = await this.appEnvironmentUtilService.getAll(organizationId);
    if (!environments.length) throw new BadRequestException('No environments found for organization');
    if (!isMultiEnvEnabled) return [environments.map((env) => env.id)];
    if (requestedEnvironmentId) return [[requestedEnvironmentId]];
    return environments.map((env) => [env.id]);
  }

  private async getResolvedOpenApiSpecOptions(dataSourceId: string, organizationId: string, environmentId: string) {
    const dataSourceOptions = await this.appEnvironmentUtilService.getOptions(
      dataSourceId,
      organizationId,
      environmentId
    );
    return dataSourceOptions?.options || {};
  }

  private async writeOpenApiSpecOptions(
    dataSourceId: string,
    organizationId: string,
    environmentId: string,
    patch: Record<string, any>
  ): Promise<void> {
    const existing = await this.getResolvedOpenApiSpecOptions(dataSourceId, organizationId, environmentId);
    const options = { ...existing };
    for (const key of Object.keys(patch)) {
      options[key] = { value: patch[key], encrypted: false };
    }
    await this.appEnvironmentUtilService.updateOptions(options, environmentId, dataSourceId);
  }
}
