import { User } from '@entities/user.entity';
import {
  AuthorizeDataSourceOauthDto,
  CreateDataSourceDto,
  GetDataSourceOauthUrlDto,
  TestDataSourceDto,
  TestSampleDataSourceDto,
  UpdateDataSourceDto,
} from '../dto';

export interface IDataSourcesController {
  fetchGlobalDataSources(user: User): Promise<{ data_sources: object[] }>;

  fetchGlobalDataSourcesForVersion(
    user: User,
    appVersionId: string,
    environmentId: string
  ): Promise<{ data_sources: object[] }>;

  createGlobalDataSources(user: User, createDataSourceDto: CreateDataSourceDto): Promise<any>;

  update(
    user: User,
    dataSourceId: string,
    environmentId: string,
    updateDataSourceDto: UpdateDataSourceDto
  ): Promise<void>;

  delete(user: User, dataSourceId: string): Promise<void>;

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
}
