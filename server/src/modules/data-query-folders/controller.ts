import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';
import { DataQueryFoldersService } from './service';
import { IDataQueryFoldersController } from './interfaces/IController';
import { BatchReorderDto, CreateFolderDto, DeleteFolderDto, RenameFolderDto, ReorderDto } from './dto';

@InitModule(MODULES.DATA_QUERY_FOLDERS)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
@Controller('data-query-folders')
export class DataQueryFoldersController implements IDataQueryFoldersController {
  constructor(protected dataQueryFoldersService: DataQueryFoldersService) {}

  @InitFeature(FEATURE_KEY.CREATE)
  @Post()
  async createFolder(@Body() _dto: CreateFolderDto): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.GET)
  @Get()
  async getFolders(@Query('appVersionId') appVersionId: string): Promise<any> {
    return this.dataQueryFoldersService.getFolders(appVersionId);
  }

  // Static PATCH routes MUST be registered before parameterized /:id route
  // otherwise Express matches /:id first (e.g., id = "reorder")
  @InitFeature(FEATURE_KEY.REORDER)
  @Patch('/reorder')
  async reorder(@Body() _dto: ReorderDto): Promise<void> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.REORDER)
  @Patch('/batch-reorder')
  async batchReorder(@Body() _dto: BatchReorderDto): Promise<void> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.UPDATE)
  @Patch('/:id')
  async renameFolder(@Param('id') _id: string, @Body() _dto: RenameFolderDto): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.DELETE)
  @Delete('/:id')
  async deleteFolder(@Param('id') _id: string, @Body() _dto: DeleteFolderDto): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
