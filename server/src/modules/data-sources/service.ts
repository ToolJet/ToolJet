import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSourcesRepository } from './repository';
import { DataSourcesUtilService } from './util.service';
import { User } from '@entities/user.entity';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { MODULES } from '@modules/app/constants/modules';
import { decode } from 'js-base64';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { decamelizeKeys } from 'humps';
import { DataSourceTypes } from './constants';
import {
  AuthorizeDataSourceOauthDto,
  CreateDataSourceDto,
  GetDataSourceOauthUrlDto,
  TestDataSourceDto,
  TestSampleDataSourceDto,
  UpdateDataSourceDto,
} from './dto';
import { GetQueryVariables, UpdateOptions } from './types';
import { DataSource } from '@entities/data_source.entity';
import { PluginsServiceSelector } from './services/plugin-selector.service';
import { IDataSourcesService } from './interfaces/IService';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';

@Injectable()
export class DataSourcesService implements IDataSourcesService {
  constructor(
    protected readonly dataSourcesRepository: DataSourcesRepository,
    protected readonly dataSourcesUtilService: DataSourcesUtilService,
    protected readonly abilityService: AbilityService,
    protected readonly appEnvironmentsUtilService: AppEnvironmentUtilService,
    protected readonly pluginsServiceSelector: PluginsServiceSelector
  ) {}

  async getForApp(query: GetQueryVariables, user: User): Promise<{ data_sources: object[] }> {
    const userPermissions = await this.abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.GLOBAL_DATA_SOURCE }],
      organizationId: user.organizationId,
    });
    const shouldIncludeWorkflows = query.shouldIncludeWorkflows ?? true;

    const dataSources = await this.dataSourcesRepository.allGlobalDS(userPermissions, user.organizationId, query ?? {});
    let staticDataSources = await this.dataSourcesRepository.getAllStaticDataSources(query.appVersionId);


    if (!shouldIncludeWorkflows) {
      // remove workflowsdefault data source from static data sources
      staticDataSources = staticDataSources.filter((dataSource) => dataSource.kind !== 'workflows');
    }
    const decamelizedDatasources = decamelizeKeys([...staticDataSources, ...dataSources]);
    return { data_sources: decamelizedDatasources };
  }

  async getAll(query: GetQueryVariables, user: User): Promise<{ data_sources: object[] }> {
    const userPermissions = await this.abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.GLOBAL_DATA_SOURCE }],
      organizationId: user.organizationId,
    });

    const selectedEnvironmentId =
      query.environmentId || (await this.appEnvironmentsUtilService.get(user.organizationId, null, true))?.id;

    const dataSources = await this.dataSourcesRepository.allGlobalDS(userPermissions, user.organizationId, {
      appVersionId: query.appVersionId,
      environmentId: selectedEnvironmentId,
    });
    for (const dataSource of dataSources) {
      const parseIfNeeded = (data: any) => {
        if (typeof data === 'object' && data !== null) return data;
        if (Buffer.isBuffer(data) || typeof data === 'string') {
          return JSON.parse(decode(data.toString('utf8')));
        }
        return data;
      };
      try {
        if (dataSource.pluginId) {
          if (Buffer.isBuffer(dataSource.plugin.iconFile.data)) {
            dataSource.plugin.iconFile.data = dataSource.plugin.iconFile.data.toString('utf8');
          }
          dataSource.plugin.manifestFile.data = parseIfNeeded(dataSource.plugin.manifestFile.data);
          dataSource.plugin.operationsFile.data = parseIfNeeded(dataSource.plugin.operationsFile.data);
        }
      } catch (error) {
        throw new BadRequestException(
          `Error parsing plugin data for dataSourceId: ${dataSource.id}. Details: ${error.message}`
        );
      }
    }

    const decamelizedDatasources = dataSources.map((dataSource) => {
      if (dataSource.pluginId) {
        return dataSource;
      }

      if (dataSource.kind === 'openapi') {
        const { options, ...objExceptOptions } = dataSource;
        const tempDs = decamelizeKeys(objExceptOptions);
        const { spec, ...objExceptSpec } = options;
        const decamelizedOptions = decamelizeKeys(objExceptSpec);
        decamelizedOptions['spec'] = spec;
        tempDs['options'] = decamelizedOptions;
        return tempDs;
      }

      if (dataSource.type === DataSourceTypes.SAMPLE) {
        delete dataSource.options;
      }
      return decamelizeKeys(dataSource);
    });

    return { data_sources: decamelizedDatasources };
  }

  async create(createDataSourceDto: CreateDataSourceDto, user: User): Promise<DataSource> {
    const { kind, name, options, plugin_id: pluginId, environment_id } = createDataSourceDto;

    if (kind === 'grpc') {
      const rootDir = process.cwd().split('/').slice(0, -1).join('/');
      const protoFilePath = `${rootDir}/protos/service.proto`;
      const fs = require('fs');

      const filecontent = fs.readFileSync(protoFilePath, 'utf8');
      const rcps = await this.dataSourcesUtilService.getServiceAndRpcNames(filecontent);
      options.find((option) => option['key'] === 'protobuf').value = JSON.stringify(rcps, null, 2);
    }
    const dataSource = await this.dataSourcesUtilService.create(
      {
        name,
        kind,
        options,
        pluginId,
        environmentId: environment_id,
      },
      user
    );

    // Setting data for audit logs
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: dataSource?.id,
      resourceName: dataSource?.name,
      metadata: dataSource,
    });

    return dataSource;
  }

  async update(updateDataSourceDto: UpdateDataSourceDto, user: User, updateOptions: UpdateOptions) {
    const { name, options } = updateDataSourceDto;
    const { dataSourceId, environmentId } = updateOptions;

    await this.dataSourcesUtilService.update(dataSourceId, user.organizationId, name, options, environmentId);

    // Setting data for audit logs
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: dataSourceId,
      resourceName: name,
      metadata: updateDataSourceDto,
    });
    return;
  }

  async delete(dataSourceId: string, user: User) {
    const dataSource = await this.dataSourcesRepository.findById(dataSourceId);
    if (!dataSource) {
      return;
    }
    if (dataSource.type === DataSourceTypes.SAMPLE) {
      throw new BadRequestException('Cannot delete sample data source');
    }
    await this.dataSourcesRepository.delete(dataSourceId);

    // Setting data for audit logs
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: dataSourceId,
      resourceName: dataSource.name,
      metadata: dataSource,
    });
    return;
  }

  async changeScope(dataSourceId: string, user: User) {
    await this.dataSourcesRepository.convertToGlobalSource(dataSourceId, user.organizationId);
  }

  async findOneByEnvironment(
    dataSourceId: string,
    organizationId: string,
    environmentId?: string
  ): Promise<DataSource> {
    const dataSource = await this.dataSourcesUtilService.findOneByEnvironment(
      dataSourceId,
      organizationId,
      environmentId
    );
    delete dataSource['dataSourceOptions'];
    return dataSource;
  }

  async testConnection(testDataSourceDto: TestDataSourceDto, organization_id: string): Promise<object> {
    return await this.dataSourcesUtilService.testConnection(testDataSourceDto, organization_id);
  }

  async testSampleDBConnection(testDataSourceDto: TestSampleDataSourceDto, user: User) {
    const { environment_id, dataSourceId } = testDataSourceDto;
    const dataSource = await this.dataSourcesUtilService.findOneByEnvironment(
      dataSourceId,
      user.defaultOrganizationId,
      environment_id
    );
    testDataSourceDto.options = dataSource.options;
    return await this.dataSourcesUtilService.testConnection(testDataSourceDto, user.organizationId);
  }
  async getAuthUrl(getDataSourceOauthUrlDto: GetDataSourceOauthUrlDto): Promise<{ url: string }> {
    return this.dataSourcesUtilService.getAuthUrl(getDataSourceOauthUrlDto);
  }

  async authorizeOauth2(
    dataSourceId: string,
    environmentId: string,
    authorizeDataSourceOauthDto: AuthorizeDataSourceOauthDto,
    user: User
  ) {
    const { code } = authorizeDataSourceOauthDto;

    const dataSource = await this.dataSourcesUtilService.findOneByEnvironment(dataSourceId, environmentId);

    if (!dataSource) {
      throw new UnauthorizedException();
    }
    // TODO: add privilege if user has data source privilege or user should have app read privilege of the apps using the data source

    await this.dataSourcesUtilService.authorizeOauth2(dataSource, code, user.id, environmentId, user.organizationId);
    return;
  }
}
