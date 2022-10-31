import allPlugins from '@tooljet/plugins/dist/server';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, Repository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { DataSource } from '../../src/entities/data_source.entity';
import { CredentialsService } from './credentials.service';
import { cleanObject } from 'src/helpers/utils.helper';
import { PluginsHelper } from '../helpers/plugins.helper';

@Injectable()
export class DataSourcesService {
  constructor(
    private readonly pluginsHelper: PluginsHelper,
    private credentialsService: CredentialsService,
    @InjectRepository(DataSource)
    private dataSourcesRepository: Repository<DataSource>
  ) {}

  async all(user: User, query: object): Promise<DataSource[]> {
    const { app_id: appId, app_version_id: appVersionId }: any = query;
    const whereClause = { appId, ...(appVersionId && { appVersionId }) };

    const result = await this.dataSourcesRepository.find({
      where: whereClause,
      relations: ['plugin', 'plugin.iconFile', 'plugin.manifestFile', 'plugin.operationsFile'],
    });

    //remove tokenData from restapi datasources
    const dataSources = result?.map((ds) => {
      if (ds.kind === 'restapi') {
        const options = {};
        Object.keys(ds.options).filter((key) => {
          if (key !== 'tokenData') {
            return (options[key] = ds.options[key]);
          }
        });
        ds.options = options;
      }
      return ds;
    });

    return dataSources;
  }

  async findOne(dataSourceId: string): Promise<DataSource> {
    return await this.dataSourcesRepository.findOne({
      where: { id: dataSourceId },
      relations: ['app', 'plugin'],
    });
  }

  async create(
    name: string,
    kind: string,
    options: Array<object>,
    appId: string,
    appVersionId?: string, // TODO: Make this non optional when autosave is implemented
    pluginId?: string
  ): Promise<DataSource> {
    const newDataSource = this.dataSourcesRepository.create({
      name,
      kind,
      options: await this.parseOptionsForCreate(options),
      appId,
      appVersionId,
      pluginId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const dataSource = await this.dataSourcesRepository.save(newDataSource);
    return dataSource;
  }

  async update(dataSourceId: string, name: string, options: Array<object>): Promise<DataSource> {
    const dataSource = await this.findOne(dataSourceId);

    // if datasource is restapi then reset the token data
    if (dataSource.kind === 'restapi')
      options.push({
        key: 'tokenData',
        value: undefined,
        encrypted: false,
      });

    const updateableParams = {
      id: dataSourceId,
      name,
      options: await this.parseOptionsForUpdate(dataSource, options),
      updatedAt: new Date(),
    };

    // Remove keys with undefined values
    cleanObject(updateableParams);

    return this.dataSourcesRepository.save(updateableParams);
  }

  async delete(dataSourceId: string) {
    return await this.dataSourcesRepository.delete(dataSourceId);
  }

  /* This function merges new options with the existing options */
  async updateOptions(dataSourceId: string, optionsToMerge: any): Promise<DataSource> {
    const dataSource = await this.findOne(dataSourceId);
    const parsedOptions = await this.parseOptionsForUpdate(dataSource, optionsToMerge);

    const updatedOptions = { ...dataSource.options, ...parsedOptions };

    return await this.dataSourcesRepository.save({
      id: dataSourceId,
      options: updatedOptions,
    });
  }

  async testConnection(kind: string, options: object, plugin_id: string): Promise<object> {
    let result = {};
    try {
      const sourceOptions = {};

      for (const key of Object.keys(options)) {
        sourceOptions[key] = options[key]['value'];
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

  async parseOptionsForCreate(options: Array<object>, entityManager = getManager()) {
    if (!options) return {};

    const optionsWithOauth = await this.parseOptionsForOauthDataSource(options);
    const parsedOptions = {};

    for (const option of optionsWithOauth) {
      if (option['encrypted']) {
        const credential = await this.credentialsService.create(option['value'] || '', entityManager);

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
          await this.credentialsService.update(existingCredentialId, option['value'] || '');

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
    userId: string
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
      await this.updateOptions(dataSourceId, tokenOptions);
    }
  }

  getAuthUrl(provider: string, sourceOptions?: any): { url: string } {
    const service = new allPlugins[provider]();
    return { url: service.authUrl(sourceOptions) };
  }
}
