import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { DataSource } from '../../src/entities/data_source.entity';
import { CredentialsService } from './credentials.service';
import { allPlugins } from 'src/modules/data_sources/plugins';

@Injectable()
export class DataSourcesService {
  constructor(
    private credentialsService: CredentialsService,
    @InjectRepository(DataSource)
    private dataSourcesRepository: Repository<DataSource>,
  ) {}

  async all(user: User, appId: string): Promise<DataSource[]> {
    return await this.dataSourcesRepository.find({
      where: {
        appId,
      },
    });
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
  ): Promise<DataSource> {
    const newDataSource = this.dataSourcesRepository.create({
      name,
      kind,
      options: await this.parseOptionsForCreate(options),
      appId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const dataSource = await this.dataSourcesRepository.save(newDataSource);
    return dataSource;
  }

  async update(
    dataSourceId: string,
    name: string,
    options: Array<object>,
  ): Promise<DataSource> {
    const dataSource = await this.findOne(dataSourceId);

    const updateableParams = {
      id: dataSourceId,
      name,
      options: await this.parseOptionsForUpdate(dataSource, options),
      updatedAt: new Date(),
    };

    // Remove keys with undefined values
    Object.keys(updateableParams).forEach((key) =>
      updateableParams[key] === undefined ? delete updateableParams[key] : {},
    );

    return this.dataSourcesRepository.save(updateableParams);
  }

  /* This function merges new options with the existing options */
  async updateOptions(
    dataSourceId: string,
    optionsToMerge: any,
  ): Promise<DataSource> {
    const dataSource = await this.findOne(dataSourceId);
    const parsedOptions = await this.parseOptionsForUpdate(
      dataSource,
      optionsToMerge,
    );

    const updatedOptions = { ...dataSource.options, ...parsedOptions };

    return await this.dataSourcesRepository.save({
      id: dataSourceId,
      options: updatedOptions,
    });
  }

  async testConnection(kind: string, options: object): Promise<object> {
    let result = {};
    try {
      let sourceOptions = {};

      for (const key of Object.keys(options)) {
        sourceOptions[key] = options[key]['value'];
      }

      const plugins = await allPlugins;
      const serviceClass = plugins[kind];
      const service = new serviceClass();
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
    if (options.find((option) => option['key'] === 'oauth2')) {
      const provider = options.find((option) => option['key'] === 'provider')[
        'value'
      ];
      const authCode = options.find((option) => option['key'] === 'code')[
        'value'
      ];

      const plugins = await allPlugins;
      const queryService = new plugins[provider]();
      const accessDetails = await queryService.accessDetailsFrom(authCode);

      for (const row of accessDetails) {
        const option = {};
        option['key'] = row[0];
        option['value'] = row[1];
        option['encrypted'] = true;

        options.push(option);
      }

      options = options.filter(
        (option) => !['provider', 'code', 'oauth2'].includes(option['key']),
      );
    }

    return options;
  }

  async parseOptionsForCreate(options: Array<object>) {
    if (!options) return {};

    const optionsWithOauth = await this.parseOptionsForOauthDataSource(options);
    const parsedOptions = {};

    for (const option of optionsWithOauth) {
      if (option['encrypted']) {
        const credential = await this.credentialsService.create(
          option['value'] || '',
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

  async parseOptionsForUpdate(dataSource: DataSource, options: Array<object>) {
    if (!options) return {};

    const optionsWithOauth = await this.parseOptionsForOauthDataSource(options);
    const parsedOptions = {};

    for (const option of optionsWithOauth) {
      if (option['encrypted']) {
        const existingCredentialId =
          dataSource.options[option['key']]['credential_id'];

        await this.credentialsService.update(
          existingCredentialId,
          option['value'] || '',
        );

        parsedOptions[option['key']] = {
          credential_id: existingCredentialId,
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

  async getAuthUrl(provider): Promise<object> {
    const plugins = await allPlugins;
    const service = new plugins[provider]();
    return { url: service.authUrl() };
  }
}
