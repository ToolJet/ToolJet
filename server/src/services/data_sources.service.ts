import allPlugins from '@tooljet/plugins/dist/server';
import { Injectable, NotAcceptableException, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, getManager, Repository } from 'typeorm';
import { DataSource } from '../../src/entities/data_source.entity';
import { CredentialsService } from './credentials.service';
import { cleanObject, dbTransactionWrap } from 'src/helpers/utils.helper';
import { PluginsHelper } from '../helpers/plugins.helper';
import { AppEnvironmentService } from './app_environments.service';
import { App } from 'src/entities/app.entity';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { DataSourceTypes } from 'src/helpers/data_source.constants';

@Injectable()
export class DataSourcesService {
  constructor(
    private readonly pluginsHelper: PluginsHelper,
    private credentialsService: CredentialsService,
    private appEnvironmentService: AppEnvironmentService,
    @InjectRepository(DataSource)
    private dataSourcesRepository: Repository<DataSource>
  ) {}

  async all(query: object): Promise<DataSource[]> {
    const { app_version_id: appVersionId, environmentId }: any = query;
    let selectedEnvironmentId = environmentId;

    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (!environmentId) {
        selectedEnvironmentId = (await this.appEnvironmentService.get(appVersionId, null, manager))?.id;
      }
      const result = await manager
        .createQueryBuilder(DataSource, 'data_source')
        .innerJoinAndSelect('data_source.dataSourceOptions', 'data_source_options')
        .leftJoinAndSelect('data_source.plugin', 'plugin')
        .leftJoinAndSelect('plugin.iconFile', 'iconFile')
        .leftJoinAndSelect('plugin.manifestFile', 'manifestFile')
        .leftJoinAndSelect('plugin.operationsFile', 'operationsFile')
        .where('data_source_options.environmentId = :selectedEnvironmentId', { selectedEnvironmentId })
        .andWhere('data_source.appVersionId = :appVersionId', { appVersionId })
        .andWhere('data_source.type != :staticType', { staticType: DataSourceTypes.STATIC })
        .getMany();

      //remove tokenData from restapi datasources
      const dataSources = result?.map((ds) => {
        if (ds.kind === 'restapi') {
          const options = {};
          Object.keys(ds.dataSourceOptions?.[0]?.options || {}).filter((key) => {
            if (key !== 'tokenData') {
              return (options[key] = ds.dataSourceOptions[0].options[key]);
            }
          });
          ds.options = options;
        } else {
          ds.options = { ...(ds.dataSourceOptions?.[0]?.options || {}) };
        }
        delete ds['dataSourceOptions'];
        return ds;
      });

      return dataSources;
    });
  }

  async findOne(dataSourceId: string): Promise<DataSource> {
    return await this.dataSourcesRepository.findOneOrFail({
      where: { id: dataSourceId },
      relations: ['plugin', 'apps', 'dataSourceOptions'],
    });
  }

  async findOneByEnvironment(dataSourceId: string, environmentId?: string): Promise<DataSource> {
    const dataSource = await this.dataSourcesRepository.findOneOrFail({
      where: { id: dataSourceId },
      relations: ['plugin', 'apps', 'dataSourceOptions'],
    });

    if (!environmentId && dataSource.dataSourceOptions?.length > 1) {
      throw new NotAcceptableException('Environment id should not be empty');
    }
    if (environmentId) {
      dataSource.options = (await this.appEnvironmentService.getOptions(dataSourceId, null, environmentId)).options;
    } else {
      dataSource.options = dataSource.dataSourceOptions?.[0]?.options || {};
    }
    return dataSource;
  }

  async findApp(dataSourceId: string, manager: EntityManager): Promise<App> {
    return (
      await manager
        .createQueryBuilder(DataSource, 'data_source')
        .innerJoinAndSelect('data_source.apps', 'apps')
        .where('data_source.id = :dataSourceId', { dataSourceId })
        .getOneOrFail()
    ).app;
  }

  async findDefaultDataSourceByKind(kind: string, appVersionId?: string, environmentId?: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const currentEnv = environmentId
        ? await manager.findOneOrFail(AppEnvironment, { where: { id: environmentId } })
        : await manager.findOneOrFail(AppEnvironment, { where: { isDefault: true, appVersionId } });
      return await manager.findOneOrFail(DataSource, {
        where: { kind, appVersionId: currentEnv.appVersionId, type: DataSourceTypes.STATIC },
        relations: ['plugin', 'apps'],
      });
    });
  }

  async findDefaultDataSource(
    kind: string,
    appVersionId: string,
    pluginId: string,
    manager: EntityManager
  ): Promise<DataSource> {
    const defaultDataSource = await manager.findOne(DataSource, {
      where: { kind, appVersionId, type: DataSourceTypes.STATIC },
    });

    if (defaultDataSource) {
      return defaultDataSource;
    }
    const dataSource = await this.createDefaultDataSource(kind, appVersionId, pluginId, manager);
    await this.appEnvironmentService.createDataSourceInAllEnvironments(appVersionId, dataSource.id, manager);
    return dataSource;
  }

  async createDefaultDataSource(
    kind: string,
    appVersionId: string,
    pluginId: string,
    manager?: EntityManager
  ): Promise<DataSource> {
    const newDataSource = manager.create(DataSource, {
      name: `${kind}default`,
      kind,
      appVersionId,
      type: DataSourceTypes.STATIC,
      pluginId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return await manager.save(newDataSource);
  }

  async create(
    name: string,
    kind: string,
    options: Array<object>,
    appVersionId: string,
    pluginId?: string,
    environmentId?: string
  ): Promise<DataSource> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const newDataSource = manager.create(DataSource, {
        name,
        kind,
        appVersionId,
        pluginId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const dataSource = await manager.save(newDataSource);

      // Creating empty options mapping
      await this.appEnvironmentService.createDataSourceInAllEnvironments(appVersionId, dataSource.id, manager);

      // Find the environment to be updated
      const envToUpdate = await this.appEnvironmentService.get(appVersionId, environmentId, manager);

      await this.appEnvironmentService.updateOptions(
        await this.parseOptionsForCreate(options, false, manager),
        envToUpdate.id,
        dataSource.id,
        manager
      );

      // Find other environments to be updated
      const allEnvs = await this.appEnvironmentService.getAll(appVersionId, manager);

      if (allEnvs?.length) {
        const envsToUpdate = allEnvs.filter((env) => env.id !== envToUpdate.id);
        await Promise.all(
          envsToUpdate?.map(async (env) => {
            await this.appEnvironmentService.updateOptions(
              await this.parseOptionsForCreate(options, true, manager),
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

  async update(dataSourceId: string, name: string, options: Array<object>, environmentId?: string): Promise<void> {
    const dataSource = await this.findOne(dataSourceId);

    await dbTransactionWrap(async (manager: EntityManager) => {
      const envToUpdate = await this.appEnvironmentService.get(dataSource.appVersionId, environmentId, manager);

      // if datasource is restapi then reset the token data
      if (dataSource.kind === 'restapi')
        options.push({
          key: 'tokenData',
          value: undefined,
          encrypted: false,
        });

      dataSource.options = (await this.appEnvironmentService.getOptions(dataSourceId, null, envToUpdate.id)).options;

      await this.appEnvironmentService.updateOptions(
        await this.parseOptionsForUpdate(dataSource, options),
        envToUpdate.id,
        dataSource.id,
        manager
      );
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

  async delete(dataSourceId: string) {
    return await this.dataSourcesRepository.delete(dataSourceId);
  }

  /* This function merges new options with the existing options */
  async updateOptions(dataSourceId: string, optionsToMerge: any, environmentId?: string): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const dataSource = await manager.findOneOrFail(DataSource, dataSourceId, { relations: ['dataSourceOptions'] });
      const parsedOptions = await this.parseOptionsForUpdate(dataSource, optionsToMerge);
      const envToUpdate = await this.appEnvironmentService.get(dataSource.appVersionId, environmentId, manager);
      const oldOptions = dataSource.dataSourceOptions?.[0]?.options || {};
      const updatedOptions = { ...oldOptions, ...parsedOptions };

      await this.appEnvironmentService.updateOptions(updatedOptions, envToUpdate.id, dataSourceId, manager);
    });
  }

  async testConnection(kind: string, options: object, plugin_id: string): Promise<object> {
    let result = {};
    try {
      const sourceOptions = {};

      for (const key of Object.keys(options)) {
        const credentialId = options[key]?.['credential_id'];
        if (credentialId) {
          sourceOptions[key] = await this.credentialsService.getValue(credentialId);
        } else {
          sourceOptions[key] = options[key]['value'];
        }
      }

      const service = await this.pluginsHelper.getService(plugin_id, kind);
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

  async parseOptionsForOauthDataSource(options: Array<object>) {
    const findOption = (opts: any[], key: string) => opts.find((opt) => opt['key'] === key);

    if (findOption(options, 'oauth2') && findOption(options, 'code')) {
      const provider = findOption(options, 'provider')['value'];
      const authCode = findOption(options, 'code')['value'];

      const queryService = new allPlugins[provider]();
      const accessDetails = await queryService.accessDetailsFrom(authCode, options);

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

  async parseOptionsForCreate(options: Array<object>, resetSecureData = false, entityManager = getManager()) {
    if (!options) return {};

    const optionsWithOauth = await this.parseOptionsForOauthDataSource(options);
    const parsedOptions = {};

    for (const option of optionsWithOauth) {
      if (option['encrypted']) {
        const credential = await this.credentialsService.create(
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
  }

  async parseOptionsForUpdate(dataSource: DataSource, options: Array<object>, entityManager = getManager()) {
    if (!options) return {};

    const optionsWithOauth = await this.parseOptionsForOauthDataSource(options);
    const parsedOptions = {};

    for (const option of optionsWithOauth) {
      if (option['encrypted']) {
        const existingCredentialId =
          dataSource.options[option['key']] && dataSource.options[option['key']]['credential_id'];

        if (existingCredentialId) {
          (option['value'] || option['value'] === '') &&
            (await this.credentialsService.update(existingCredentialId, option['value'] || ''));

          parsedOptions[option['key']] = {
            credential_id: existingCredentialId,
            encrypted: option['encrypted'],
          };
        } else {
          const credential = await this.credentialsService.create(option['value'] || '', entityManager);

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
  }

  private changeCurrentToken = (
    tokenData: any,
    userId: string,
    accessTokenDetails: any,
    isMultiAuthEnabled: boolean
  ) => {
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
  };

  async updateOAuthAccessToken(
    accessTokenDetails: object,
    dataSourceOptions: object,
    dataSourceId: string,
    userId: string,
    environmentId?: string
  ) {
    const existingAccessTokenCredentialId =
      dataSourceOptions['access_token'] && dataSourceOptions['access_token']['credential_id'];
    const existingRefreshTokenCredentialId =
      dataSourceOptions['refresh_token'] && dataSourceOptions['refresh_token']['credential_id'];
    if (existingAccessTokenCredentialId) {
      await this.credentialsService.update(existingAccessTokenCredentialId, accessTokenDetails['access_token']);

      existingRefreshTokenCredentialId &&
        accessTokenDetails['refresh_token'] &&
        (await this.credentialsService.update(existingRefreshTokenCredentialId, accessTokenDetails['refresh_token']));
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
      await this.updateOptions(dataSourceId, tokenOptions, environmentId);
    }
  }

  getAuthUrl(provider: string, sourceOptions?: any): { url: string } {
    const service = new allPlugins[provider]();
    return { url: service.authUrl(sourceOptions) };
  }
}
