import { DataSource } from '@entities/data_source.entity';
import { User } from '@entities/user.entity';
import {
  AuthorizeDataSourceOauthDto,
  CreateDataSourceDto,
  GetDataSourceOauthUrlDto,
  TestDataSourceDto,
  TestSampleDataSourceDto,
  UpdateDataSourceDto,
} from '../dto';
import { GetQueryVariables, UpdateOptions } from '../types';
import { UserPermissions } from '@modules/ability/types';
import { QueryResult } from '@tooljet/plugins/dist/packages/common/lib';

export interface IDataSourcesService {
  getForApp(
    query: GetQueryVariables,
    user: User,
    userPermissions: UserPermissions
  ): Promise<{ data_sources: object[] }>;

  getAll(query: GetQueryVariables, user: User, userPermissions: UserPermissions): Promise<{ data_sources: object[] }>;

  create(createDataSourceDto: CreateDataSourceDto, user: User, branchId?: string): Promise<DataSource>;

  update(
    updateDataSourceDto: UpdateDataSourceDto,
    user: User,
    updateOptions: UpdateOptions,
    branchId?: string
  ): Promise<void>;

  delete(dataSourceId: string, user: User, branchId?: string): Promise<void>;

  changeScope(dataSourceId: string, user: User): Promise<void>;

  findOneByEnvironment(
    dataSourceId: string,
    environmentId: string,
    organizationId?: string,
    branchId?: string
  ): Promise<DataSource>;

  testConnection(testDataSourceDto: TestDataSourceDto, organization_id: string): Promise<object>;

  testSampleDBConnection(testDataSourceDto: TestSampleDataSourceDto, user: User): Promise<object>;

  getAuthUrl(getDataSourceOauthUrlDto: GetDataSourceOauthUrlDto): Promise<{ url: string }>;

  authorizeOauth2(
    dataSourceId: string,
    environmentId: string,
    authorizeDataSourceOauthDto: AuthorizeDataSourceOauthDto,
    user: User
  ): Promise<void>;

  invokeMethod(
    dataSource: DataSource,
    methodName: string,
    user: User,
    environmentId: string,
    args?: any,
    branchId?: string
  ): Promise<QueryResult>;
}
