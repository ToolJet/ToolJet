import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { IExternalApisDataSourcesControllerV2 } from '../Interfaces/IController';
import {
  ListDataSourcesV2QueryDto,
  GetDataSourceV2QueryDto,
  ListDataSourceQueriesV2QueryDto,
  TestDataSourceConnectionV2Dto,
  DataSourceV2ResponseDto,
  ListDataSourcesV2ResponseDto,
  ListDataSourceQueriesV2ResponseDto,
  TestDataSourceConnectionV2ResponseDto,
} from '../dto';

@Controller({ path: 'ext', version: '2' })
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ExternalApisDataSourcesControllerV2 implements IExternalApisDataSourcesControllerV2 {
  listDataSources(
    workspaceIdentifier: string,
    query: ListDataSourcesV2QueryDto
  ): Promise<ListDataSourcesV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  getDataSource(
    workspaceIdentifier: string,
    dataSourceId: string,
    query: GetDataSourceV2QueryDto
  ): Promise<DataSourceV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  listDataSourceQueries(
    workspaceIdentifier: string,
    dataSourceId: string,
    query: ListDataSourceQueriesV2QueryDto
  ): Promise<ListDataSourceQueriesV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
  testConnection(
    workspaceIdentifier: string,
    dataSourceId: string,
    dto: TestDataSourceConnectionV2Dto
  ): Promise<TestDataSourceConnectionV2ResponseDto> {
    throw new Error('Method not implemented.');
  }
}
