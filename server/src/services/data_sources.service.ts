import allPlugins from '@tooljet/plugins/dist/server';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, Repository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { DataSource } from '../../src/entities/data_source.entity';
import { CredentialsService } from './credentials.service';
import { cleanObject } from 'src/helpers/utils.helper';

@Injectable()
export class DataSourcesService {
  constructor(
    private credentialsService: CredentialsService,
    @InjectRepository(DataSource)
    private dataSourcesRepository: Repository<DataSource>
  ) {}

  async all(user: User, query: object): Promise<DataSource[]> {
    const { app_id: appId, app_version_id: appVersionId }: any = query;
    const whereClause = { appId, ...(appVersionId && { appVersionId }) };

    return await this.dataSourcesRepository.find({ where: whereClause });
  }

  async findOne(dataSourceId: string): Promise<DataSource> {
    return await this.dataSourcesRepository.findOne({
      where: { id: dataSourceId },
      relations: ['app'],
    });
  }

  async create(
    name: string,
    kind: string,
    options: Array<object>,
    appId: string,
    appVersionId?: string // TODO: Make this non optional when autosave is implemented
  ): Promise<DataSource> {
    const newDataSource = this.dataSourcesRepository.create({
      name,
      kind,
      options: await this.parseOptionsForCreate(options),
      appId,
      appVersionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const dataSource = await this.dataSourcesRepository.save(newDataSource);
    return dataSource;
  }

  async update(dataSourceId: string, name: string, options: Array<object>): Promise<DataSource> {
    const dataSource = await this.findOne(dataSourceId);

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

  async testConnection(kind: string, options: object): Promise<object> {
    let result = {};
    try {
      const sourceOptions = {};

      for (const key of Object.keys(options)) {
        sourceOptions[key] = options[key]['value'];
      }

      const service = new allPlugins[kind]();
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
      const accessDetails = await queryService.accessDetailsFrom(authCode);

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

  async updateOAuthAccessToken(accessTokenDetails: object, dataSourceOptions: object, dataSourceId: string) {
    const existingCredentialId =
      dataSourceOptions['access_token'] && dataSourceOptions['access_token']['credential_id'];
    if (existingCredentialId) {
      await this.credentialsService.update(existingCredentialId, accessTokenDetails['access_token']);
    } else if (dataSourceId) {
      const tokenOptions = [
        {
          key: 'tokenData',
          value: accessTokenDetails,
          encrypted: false,
        },
      ];
      await this.updateOptions(dataSourceId, tokenOptions);
    }
  }

  async getAuthUrl(provider): Promise<object> {
    const service = new allPlugins[provider]();
    return { url: service.authUrl() };
  }
}
