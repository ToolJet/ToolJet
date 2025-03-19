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

export interface IDataSourcesService {
  getForApp(query: GetQueryVariables, user: User): Promise<{ data_sources: object[] }>;

  getAll(query: GetQueryVariables, user: User): Promise<{ data_sources: object[] }>;

  create(createDataSourceDto: CreateDataSourceDto, user: User): Promise<DataSource>;

  update(updateDataSourceDto: UpdateDataSourceDto, user: User, updateOptions: UpdateOptions): Promise<void>;

  delete(dataSourceId: string, user: User): Promise<void>;

  changeScope(dataSourceId: string, user: User): Promise<void>;

  findOneByEnvironment(dataSourceId: string, organizationId: string, environmentId?: string): Promise<DataSource>;

  testConnection(testDataSourceDto: TestDataSourceDto, organization_id: string): Promise<object>;

  testSampleDBConnection(testDataSourceDto: TestSampleDataSourceDto, user: User): Promise<object>;

  getAuthUrl(getDataSourceOauthUrlDto: GetDataSourceOauthUrlDto): Promise<{ url: string }>;

  authorizeOauth2(
    dataSourceId: string,
    environmentId: string,
    authorizeDataSourceOauthDto: AuthorizeDataSourceOauthDto,
    user: User
  ): Promise<void>;
}
