import allPlugins from '@tooljet/plugins/dist/server';
import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, getManager, Repository } from 'typeorm';
import { DataSource } from '../../src/entities/data_source.entity';
import { CredentialsService } from './credentials.service';
import { cleanObject, dbTransactionWrap, defaultAppEnvironments } from 'src/helpers/utils.helper';
import { AppEnvironmentService } from './app_environments.service';
import { DataSourceScopes, DataSourceTypes } from 'src/helpers/data_source.constants';
import { AppEnvironment } from 'src/entities/app_environments.entity';

@Injectable()
export class GlobalDataSourcesService {
  constructor(
    private credentialsService: CredentialsService,
    private appEnvironmentService: AppEnvironmentService,
    @InjectRepository(DataSource)
    private dataSourcesRepository: Repository<DataSource>
  ) {}

  async all(query: object, organizationId: string): Promise<DataSource[]> {
    const { environmentId }: any = query;
    let selectedEnvironmentId = environmentId;

    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (!environmentId) {
        selectedEnvironmentId = (await manager.findOne(AppEnvironment, { where: { organizationId, isDefault: true } }))
          ?.id;
      }
      if (!selectedEnvironmentId) {
        await Promise.all(
          defaultAppEnvironments.map(async (en) => {
            const env = manager.create(AppEnvironment, {
              organizationId: organizationId,
              name: en.name,
              isDefault: en.isDefault,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            await manager.save(env);
          })
        );
      }
      const result = await manager
        .createQueryBuilder(DataSource, 'data_source')
        .innerJoinAndSelect('data_source.dataSourceOptions', 'data_source_options')
        .leftJoinAndSelect('data_source.plugin', 'plugin')
        .leftJoinAndSelect('plugin.iconFile', 'iconFile')
        .leftJoinAndSelect('plugin.manifestFile', 'manifestFile')
        .leftJoinAndSelect('plugin.operationsFile', 'operationsFile')
        .where('data_source_options.environmentId = :selectedEnvironmentId', { selectedEnvironmentId })
        .andWhere('data_source.type != :staticType', { staticType: DataSourceTypes.STATIC })
        .andWhere('data_source.organization_id = :organizationId', { organizationId })
        .andWhere('data_source.scope = :scope', { scope: DataSourceScopes.GLOBAL })
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

  async findOneByEnvironment(
    dataSourceId: string,
    organizationId: string,
    environmentId?: string
  ): Promise<DataSource> {
    const dataSource = await this.dataSourcesRepository.findOneOrFail({
      where: { id: dataSourceId },
      relations: ['plugin', 'apps', 'dataSourceOptions'],
    });

    if (!environmentId && dataSource.dataSourceOptions?.length > 1) {
      throw new NotAcceptableException('Environment id should not be empty');
    }
    if (environmentId) {
      dataSource.options = (
        await this.appEnvironmentService.getOptions(dataSourceId, organizationId, environmentId)
      ).options;
    } else {
      dataSource.options = dataSource.dataSourceOptions?.[0]?.options || {};
    }
    return dataSource;
  }

  async update(
    dataSourceId: string,
    organizationId: string,
    name: string,
    options: Array<object>,
    environmentId?: string
  ): Promise<void> {
    const dataSource = await this.findOne(dataSourceId);

    await dbTransactionWrap(async (manager: EntityManager) => {
      const envToUpdate = await this.appEnvironmentService.get(organizationId, environmentId, manager);

      // if datasource is restapi then reset the token data
      if (dataSource.kind === 'restapi')
        options.push({
          key: 'tokenData',
          value: undefined,
          encrypted: false,
        });

      dataSource.options = (
        await this.appEnvironmentService.getOptions(dataSourceId, organizationId, envToUpdate.id)
      ).options;

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

  async findDefaultDataSourceByKind(kind: string, appVersionId: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOneOrFail(DataSource, {
        where: { kind, appVersionId: appVersionId, type: DataSourceTypes.STATIC },
        relations: ['plugin', 'apps'],
      });
    });
  }

  async findDefaultDataSource(
    kind: string,
    appVersionId: string,
    pluginId: string,
    organizationId: string,
    manager: EntityManager
  ): Promise<DataSource> {
    const defaultDataSource = await manager.findOne(DataSource, {
      where: { kind, appVersionId, type: DataSourceTypes.STATIC },
    });

    if (defaultDataSource) {
      return defaultDataSource;
    }
    const dataSource = await this.createDefaultDataSource(kind, appVersionId, pluginId, manager);
    await this.appEnvironmentService.createDataSourceInAllEnvironments(organizationId, dataSource.id, manager);
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
    organizationId: string,
    scope: string = DataSourceScopes.LOCAL,
    pluginId?: string,
    environmentId?: string
  ): Promise<DataSource> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const newDataSource = manager.create(DataSource, {
        name,
        kind,
        pluginId,
        organizationId,
        scope,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const dataSource = await manager.save(newDataSource);

      // Creating empty options mapping
      await this.appEnvironmentService.createDataSourceInAllEnvironments(organizationId, dataSource.id, manager);

      // Find the environment to be updated
      const envToUpdate = await this.appEnvironmentService.get(organizationId, environmentId, manager);

      await this.appEnvironmentService.updateOptions(
        await this.parseOptionsForCreate(options, false, manager),
        envToUpdate.id,
        dataSource.id,
        manager
      );

      // Find other environments to be updated
      const allEnvs = await this.appEnvironmentService.getAll(organizationId, manager);

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

  async convertToGlobalSource(datasourceId: string, organizationId: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(DataSource, {
        id: datasourceId,
        updatedAt: new Date(),
        appVersionId: null,
        organizationId,
        scope: DataSourceScopes.GLOBAL,
      });
    });
  }
}
