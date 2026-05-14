import { User } from '@entities/user.entity';
import { DataSourceEntity } from '@modules/app/decorators/data-source.decorator';
import {
  AuthorizeDataSourceOauthDto,
  CreateDataSourceDto,
  GetDataSourceOauthUrlDto,
  InvokeDataSourceMethodDto,
  TestDataSourceDto,
  TestSampleDataSourceDto,
  UpdateDataSourceDto,
} from '../dto';
import { UserPermissions } from '@modules/ability/types';
import { QueryResult } from '@tooljet/plugins/dist/packages/common/lib';

export interface IDataSourcesController {
  fetchGlobalDataSources(user: User, userPermissions: UserPermissions, branchId?: string): Promise<{ data_sources: object[] }>;

  fetchGlobalDataSourcesForVersion(
    user: User,
    appVersionId: string,
    environmentId: string,
    userPermissions: UserPermissions,
    branchId?: string
  ): Promise<{ data_sources: object[] }>;

  createGlobalDataSources(user: User, createDataSourceDto: CreateDataSourceDto, branchId?: string): Promise<any>;

  update(
    user: User,
    dataSourceId: string,
    environmentId: string,
    updateDataSourceDto: UpdateDataSourceDto,
    branchId?: string
  ): Promise<void>;

  delete(user: User, dataSourceId: string, branchId?: string): Promise<void>;

  changeScope(user: User, dataSourceId: string): Promise<void>;

  getDataSourceByEnvironment(user: User, dataSourceId: string, environmentId: string): Promise<any>;

  testConnection(user: User, testDataSourceDto: TestDataSourceDto): Promise<object>;

  testConnectionSampleDb(user: User, testDataSourceDto: TestSampleDataSourceDto): Promise<object>;

  getAuthUrl(getDataSourceOauthUrlDto: GetDataSourceOauthUrlDto): Promise<{ url: string }>;

  authorizeOauth2(
    user: User,
    id: string,
    environmentId: string,
    authorizeDataSourceOauthDto: AuthorizeDataSourceOauthDto
  ): Promise<void>;

  decryptOptions(options: Record<string, any>): Promise<any>;

  invokeDataSourceMethod(
    user: User,
    invokeDto: InvokeDataSourceMethodDto,
    dataSource: DataSourceEntity,
    branchId?: string
  ): Promise<QueryResult>;
}
