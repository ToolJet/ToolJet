import allPlugins from '@tooljet/plugins/dist/server';
import { Injectable, NotAcceptableException, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, getManager, Repository } from 'typeorm';
import { DataSource } from '../../src/entities/data_source.entity';
import { CredentialsService } from './credentials.service';
import { cleanObject, dbTransactionWrap, isSuperAdmin } from 'src/helpers/utils.helper';
import { PluginsHelper } from '../helpers/plugins.helper';
import { AppEnvironmentService } from './app_environments.service';
import { App } from 'src/entities/app.entity';
import { DataSourceScopes, DataSourceTypes } from 'src/helpers/data_source.constants';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { User } from 'src/entities/user.entity';
import { UsersService } from './users.service';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { DataSourceGroupPermission } from 'src/entities/data_source_group_permission.entity';
import { EncryptionService } from './encryption.service';
import { OrgEnvironmentVariable } from '../entities/org_envirnoment_variable.entity';
import { LicenseService } from './license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';
import { decode } from 'js-base64';

@Injectable()
export class DataSourcesService {
  constructor(
    private readonly pluginsHelper: PluginsHelper,
    private credentialsService: CredentialsService,
    private encryptionService: EncryptionService,
    private appEnvironmentService: AppEnvironmentService,
    private usersService: UsersService,
    private licenseService: LicenseService,
    @InjectRepository(DataSource)
    private dataSourcesRepository: Repository<DataSource>
  ) {}

  async all(query: object, user: User, scope: DataSourceScopes = DataSourceScopes.LOCAL): Promise<DataSource[]> {
    const { app_version_id: appVersionId, environment_id: environmentId, includeStaticSources }: any = query;
    let selectedEnvironmentId = environmentId;
    const { organizationId, id } = user;
    const isAdmin = await this.usersService.hasGroup(user, 'admin', organizationId);
    const groupPermissions = await this.usersService.groupPermissions(user);
    const canPerformCreateOrDelete = groupPermissions?.some((gp) => gp['dataSourceCreate'] || gp['dataSourceDelete']);
    const isValid = await this.licenseService.getLicenseTerms(LICENSE_FIELD.VALID);

    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (!environmentId) {
        selectedEnvironmentId = (await this.appEnvironmentService.get(organizationId, null, true, manager))?.id;
      }

      const query = await manager
        .createQueryBuilder(DataSource, 'data_source')
        .innerJoinAndSelect('data_source.dataSourceOptions', 'data_source_options')
        .leftJoinAndSelect('data_source.plugin', 'plugin')
        .leftJoinAndSelect('plugin.iconFile', 'iconFile')
        .leftJoinAndSelect('plugin.manifestFile', 'manifestFile')
        .leftJoinAndSelect('plugin.operationsFile', 'operationsFile');

      if ((!isSuperAdmin(user) || !isAdmin) && scope === DataSourceScopes.GLOBAL) {
        if (!canPerformCreateOrDelete && isValid) {
          query
            .innerJoin('data_source.groupPermissions', 'group_permissions')
            .innerJoin(
              UserGroupPermission,
              'user_group_permissions',
              'data_source_group_permissions.group_permission_id = user_group_permissions.group_permission_id'
            )
            .leftJoin('data_source.dataQueries', 'data_queries')
            .where(
              new Brackets((qb) => {
                qb.where('user_group_permissions.user_id = :userId', {
                  userId: id,
                }).andWhere('data_source_group_permissions.read = :value', { value: true });
                if (appVersionId) {
                  qb.orWhere('data_queries.app_version_id = :appVersionId', { appVersionId });
                }
              })
            );
        }
      }

      if (scope === DataSourceScopes.GLOBAL) {
        query
          .andWhere('data_source.organization_id = :organizationId', { organizationId })
          .andWhere('data_source.scope = :scope', { scope: DataSourceScopes.GLOBAL });
      } else {
        query
          .andWhere('data_source.appVersionId = :appVersionId', { appVersionId })
          .andWhere('data_source.scope = :scope', { scope: DataSourceScopes.LOCAL });
      }

      if (includeStaticSources === 'false') {
        query.andWhere('data_source.type != :staticType', { staticType: DataSourceTypes.STATIC });
      }

      const result = await query
        .andWhere('data_source_options.environmentId = :selectedEnvironmentId', { selectedEnvironmentId })
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

  async findOne(dataSourceId: string, manager?: EntityManager): Promise<DataSource> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOneOrFail(DataSource, {
        where: { id: dataSourceId },
        relations: ['plugin', 'apps', 'dataSourceOptions'],
      });
    }, manager);
  }

  async findOneByEnvironment(dataSourceId: string, environmentId?: string): Promise<DataSource> {
    const dataSource = await this.dataSourcesRepository.findOneOrFail({
      where: { id: dataSourceId },
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

    const dsOrganizationId = dataSource.organizationId || dataSource.appVersion.app.organizationId;

    if (!environmentId && dataSource.dataSourceOptions?.length > 1) {
      //fix for env id issue when importing cloud/enterprise apps to CE
      if (dataSource.dataSourceOptions?.length > 1) {
        const env = await this.appEnvironmentService.get(dsOrganizationId, null);
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
        await this.appEnvironmentService.getOptions(dataSourceId, dsOrganizationId, environmentId)
      ).options;
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
    appVersionId?: string,
    organizationId?: string,
    scope: string = DataSourceScopes.LOCAL,
    pluginId?: string,
    environmentId?: string
  ): Promise<DataSource> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const newDataSource = manager.create(DataSource, {
        name,
        kind,
        appVersionId,
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
      const envToUpdate = await this.appEnvironmentService.get(organizationId, environmentId, false, manager);

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
      await this.createDataSourceGroupPermissionsForAdmin(dataSource, manager);
      return dataSource;
    });
  }

  async createDataSourceGroupPermissionsForAdmin(dataSource: DataSource, manager: EntityManager): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const orgDefaultGroupPermissions = await manager.find(GroupPermission, {
        where: {
          organizationId: dataSource.organizationId,
          group: 'admin',
        },
      });

      for (const groupPermission of orgDefaultGroupPermissions) {
        const dataSourceGroupPermission = manager.create(DataSourceGroupPermission, {
          groupPermissionId: groupPermission.id,
          dataSourceId: dataSource.id,
          ...this.fetchDefaultDataSourceGroupPermissions(groupPermission.group),
        });

        await manager.save(dataSourceGroupPermission);
      }
    }, manager);
  }

  fetchDefaultDataSourceGroupPermissions(group: string): {
    read: boolean;
    update: boolean;
    delete: boolean;
  } {
    switch (group) {
      case 'all_users':
        return { read: true, update: false, delete: false };
      case 'admin':
        return { read: true, update: true, delete: true };
      default:
        throw `${group} is not a default group`;
    }
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
      const envToUpdate = await this.appEnvironmentService.get(organizationId, environmentId, false, manager);

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

  /* This function merges new options with the existing options */
  async updateOptions(
    dataSourceId: string,
    optionsToMerge: any,
    organizationId: string,
    environmentId?: string
  ): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const dataSource = await manager.findOneOrFail(DataSource, dataSourceId, { relations: ['dataSourceOptions'] });
      const parsedOptions = await this.parseOptionsForUpdate(dataSource, optionsToMerge);
      const envToUpdate = await this.appEnvironmentService.get(organizationId, environmentId, false, manager);
      const oldOptions = dataSource.dataSourceOptions?.[0]?.options || {};
      const updatedOptions = { ...oldOptions, ...parsedOptions };

      await this.appEnvironmentService.updateOptions(updatedOptions, envToUpdate.id, dataSourceId, manager);
    });
  }

  async testConnection(
    kind: string,
    options: object,
    plugin_id: string,
    organization_id: string,
    environment_id: string
  ): Promise<object> {
    let result = {};

    const parsedOptions = JSON.parse(JSON.stringify(options));

    for (const key of Object.keys(parsedOptions)) {
      const currentOption = parsedOptions[key]?.['value'];
      const variablesMatcher = /(%%.+?%%)/g;
      // need to match if currentOption is a contant, {{constants.psql_db}
      const constantMatcher = /{{constants\..+?}}/g;
      const variableMatched = variablesMatcher.exec(currentOption);

      if (variableMatched) {
        const resolved = await this.resolveVariable(currentOption, organization_id);
        parsedOptions[key]['value'] = resolved;
      }
      if (constantMatcher.test(currentOption)) {
        const resolved = await this.resolveConstants(currentOption, organization_id, environment_id);
        parsedOptions[key]['value'] = resolved;
      }
    }

    try {
      const sourceOptions = {};

      for (const key of Object.keys(parsedOptions)) {
        const credentialId = parsedOptions[key]?.['credential_id'];
        if (credentialId) {
          sourceOptions[key] = await this.credentialsService.getValue(credentialId);
        } else {
          sourceOptions[key] = parsedOptions[key]['value'];
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

  async parseOptionsForOauthDataSource(options: Array<object>, resetSecureData = false) {
    const findOption = (opts: any[], key: string) => opts.find((opt) => opt['key'] === key);

    if (findOption(options, 'oauth2') && findOption(options, 'code')) {
      const provider = findOption(options, 'provider')['value'];
      const authCode = findOption(options, 'code')['value'];

      const queryService = new allPlugins[provider]();
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

  async parseOptionsForCreate(options: Array<object>, resetSecureData = false, entityManager = getManager()) {
    if (!options) return {};

    const optionsWithOauth = await this.parseOptionsForOauthDataSource(options, resetSecureData);
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
    organizationId: string,
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
      await this.updateOptions(dataSourceId, tokenOptions, organizationId, environmentId);
    }
  }

  async convertToGlobalSource(datasourceId: string, organizationId: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.save(DataSource, {
        id: datasourceId,
        updatedAt: new Date(),
        appVersionId: null,
        organizationId,
        scope: DataSourceScopes.GLOBAL,
      });
      const dataSource = await this.findOne(datasourceId, manager);
      return await this.createDataSourceGroupPermissionsForAdmin(dataSource, manager);
    });
  }

  getAuthUrl(provider: string, sourceOptions?: any): { url: string } {
    const service = new allPlugins[provider]();
    return { url: service.authUrl(sourceOptions) };
  }

  async resolveConstants(str: string, organization_id: string, environmentId: string) {
    const tempStr: string = str.match(/\{\{(.*?)\}\}/g)[0].replace(/[{}]/g, '');
    let result = tempStr;
    if (new RegExp('^constants.').test(tempStr)) {
      const splitArray = tempStr.split('.');
      const constantName = splitArray[splitArray.length - 1];

      const constant = await this.appEnvironmentService.getOrgEnvironmentConstant(
        constantName,
        organization_id,
        environmentId
      );

      if (constant) {
        result = constant.value;
      }
    }

    return result;
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

      const variableResult = await OrgEnvironmentVariable.findOne({
        variableType: variableType,
        organizationId: organization_id,
        variableName: variableName,
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
}
