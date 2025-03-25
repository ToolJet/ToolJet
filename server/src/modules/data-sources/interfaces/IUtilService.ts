import { DataSource } from '@entities/data_source.entity';
import { CreateArgumentsDto, TestDataSourceDto } from '../dto';
import { User } from '@entities/user.entity';
import { EntityManager } from 'typeorm';

export interface IDataSourcesUtilService {
  create(createArgumentsDto: CreateArgumentsDto, user: User): Promise<DataSource>;

  getServiceAndRpcNames(protoDefinition: any): { [key: string]: string[] };

  parseOptionsForCreate(options: Array<object>, resetSecureData?: boolean, manager?: EntityManager): Promise<any>;

  parseOptionsForUpdate(dataSource: DataSource, options: Array<object>, manager: EntityManager): Promise<any>;

  testConnection(testDataSourceDto: TestDataSourceDto, organization_id: string): Promise<object>;

  fetchAPITokenFromPlugins(
    dataSource: DataSource,
    code: string,
    sourceOptions: any
  ): Promise<
    Array<{
      key: string;
      value: string;
      encrypted: boolean;
    }>
  >;

  createDataSourceInAllEnvironments(
    organizationId: string,
    dataSourceId: string,
    manager?: EntityManager
  ): Promise<void>;

  parseOptionsForOauthDataSource(options: Array<object>, resetSecureData?: boolean): Promise<Array<object>>;

  resolveConstants(value: string, organizationId: string, environmentId: string, userId?: string): Promise<string>;

  resolveKeyValuePair(element: any, organizationId: string, environmentId: string): Promise<any>;

  resolveValue(value: any, organizationId: string, environmentId: string): Promise<any>;
}
