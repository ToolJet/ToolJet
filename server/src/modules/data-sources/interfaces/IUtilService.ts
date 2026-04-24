import { DataSource } from '@entities/data_source.entity';
import { CreateArgumentsDto, TestDataSourceDto } from '../dto';
import { User } from '@entities/user.entity';
import { EntityManager } from 'typeorm';

export interface IDataSourcesUtilService {
  create(createArgumentsDto: CreateArgumentsDto, user: User): Promise<DataSource>;

  getServiceAndRpcNames(protoDefinition: any): { [key: string]: string[] };

  /**
   * IMPORTANT: Do not modify this function signature - it is used in data migrations.
   * Used in: 1639734070615-BackfillDataSourcesAndQueriesForAppVersions.ts
   */
  parseOptionsForCreate(options: Array<object>, resetSecureData?: boolean, manager?: EntityManager): Promise<any>;

  parseOptionsForUpdate(
    dataSource: DataSource,
    options: Array<object>,
    manager: EntityManager,
    userId: string
  ): Promise<any>;

  testConnection(testDataSourceDto: TestDataSourceDto, organization_id: string): Promise<object>;

  fetchAPITokenFromPlugins(
    dataSource: DataSource,
    code: string,
    sourceOptions: any,
    isMultiAuthEnabled: boolean,
    userId: string
  ): Promise<Array<{ key: string; value: string; encrypted: boolean }> | Record<string, any>>;

  createDataSourceInAllEnvironments(
    organizationId: string,
    dataSourceId: string,
    manager?: EntityManager
  ): Promise<void>;

  parseOptionsForOauthDataSource(
    options: Array<object>,
    resetSecureData?: boolean,
    userId?: string
  ): Promise<Array<object>>;

  resolveConstants(value: string, organizationId: string, environmentId: string, user?: User): Promise<string>;

  resolveKeyValuePair(element: any, organizationId: string, environmentId: string): Promise<any>;

  resolveValue(value: any, organizationId: string, environmentId: string): Promise<any>;
}
