import { UserEntity } from '@modules/app/decorators/user.decorator';
import { DataSourceEntity } from '@modules/app/decorators/data-source.decorator';
import { CreateDataQueryDto, UpdateDataQueryDto } from '../dto';
import { UpdatingReferencesOptionsDto } from '../dto';
import { AppAbility } from '@modules/casl/casl-ability.factory';
import { App } from '@entities/app.entity';
import { UpdateSourceDto } from '../dto';
import { Response } from 'express';
export interface IDataQueriesController {
  index(versionId: string): Promise<object>;

  create(
    user: UserEntity,
    dataSource: DataSourceEntity,
    versionId: string,
    dataQueryDto: CreateDataQueryDto
  ): Promise<object>;

  updateDataSource(
    user: UserEntity,
    dataQueryId: string,
    versionId: string,
    updateDataQueryDto: UpdateDataQueryDto
  ): Promise<void>;

  bulkUpdate(user: UserEntity, updatingReferencesOptions: UpdatingReferencesOptionsDto): Promise<object>;

  delete(dataQueryId: string): Promise<void>;

  runQueryOnBuilder(
    user: UserEntity,
    dataQueryId: string,
    environmentId: string,
    updateDataQueryDto: UpdateDataQueryDto,
    ability: AppAbility,
    dataSource: DataSourceEntity,
    response: Response
  ): Promise<object>;

  runQuery(
    user: UserEntity,
    dataQueryId: string,
    updateDataQueryDto: UpdateDataQueryDto,
    response: Response
  ): Promise<object>;

  previewQuery(
    user: UserEntity,
    app: App,
    dataSource: DataSourceEntity,
    updateDataQueryDto: UpdateDataQueryDto,
    environmentId: string,
    response: Response
  ): Promise<object>;

  changeQueryDataSource(
    user: UserEntity,
    dataSource: DataSourceEntity,
    queryId: string,
    updateDataQueryDto: UpdateSourceDto
  ): Promise<void>;
}
