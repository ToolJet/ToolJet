import { Controller, Post, UseGuards, Body, Delete, Param, Put, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../session/guards/jwt-auth.guard';
import { AddDsToFolderDto, BulkMoveDsDto, CreateDsFolderDto, UpdateDsFolderDto } from './dto';
import { User } from '@modules/app/decorators/user.decorator';
import { FolderDataSourcesService } from './service';
import { IFolderDataSourcesController } from './interfaces/IController';
import { FEATURE_KEY } from './constants';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FeatureAbilityGuard } from './ability/guard';

@InitModule(MODULES.FOLDER_DATA_SOURCES)
@Controller('data-source-folders')
export class FolderDataSourcesController implements IFolderDataSourcesController {
  constructor(protected folderDataSourcesService: FolderDataSourcesService) {}

  @InitFeature(FEATURE_KEY.GET_DATA_SOURCE_FOLDERS)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get()
  async getFolders(
    @User() user,
    @Query('search') search?: string,
    @Query('include_data_sources') includeDataSources?: string
  ) {
    return await this.folderDataSourcesService.getFolders(user, search, includeDataSources === 'true');
  }

  @InitFeature(FEATURE_KEY.CREATE_DATA_SOURCE_FOLDER)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post()
  async create(@User() user, @Body() createDsFolderDto: CreateDsFolderDto) {
    return await this.folderDataSourcesService.createFolder(user, createDsFolderDto);
  }

  @InitFeature(FEATURE_KEY.UPDATE_DATA_SOURCE_FOLDER)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Put(':id')
  async update(@User() user, @Param('id') id, @Body() updateDsFolderDto: UpdateDsFolderDto) {
    return await this.folderDataSourcesService.renameFolder(user, id, updateDsFolderDto);
  }

  @InitFeature(FEATURE_KEY.DELETE_DATA_SOURCE_FOLDER)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Delete(':id')
  async delete(@User() user, @Param('id') id) {
    return await this.folderDataSourcesService.deleteFolder(user, id);
  }

  @InitFeature(FEATURE_KEY.GET_DATA_SOURCES_IN_FOLDER)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get(':id/data-sources')
  async getDataSourcesInFolder(
    @User() user,
    @Param('id') id,
    @Query('page') page = '1',
    @Query('per_page') perPage = '25'
  ) {
    return await this.folderDataSourcesService.getDataSourcesInFolder(user, id, parseInt(page), parseInt(perPage));
  }

  @InitFeature(FEATURE_KEY.ADD_DATA_SOURCE_TO_FOLDER)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post(':id/data-sources')
  async addDataSource(@User() user, @Param('id') id, @Body() dto: AddDsToFolderDto) {
    return await this.folderDataSourcesService.addDataSourceToFolder(user, id, dto);
  }

  @InitFeature(FEATURE_KEY.REMOVE_DATA_SOURCE_FROM_FOLDER)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Delete(':id/data-sources/:dsId')
  async removeDataSource(@User() user, @Param('id') id, @Param('dsId') dsId) {
    return await this.folderDataSourcesService.removeDataSourceFromFolder(user, id, dsId);
  }

  @InitFeature(FEATURE_KEY.BULK_MOVE_DATA_SOURCES)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Put(':id/data-sources')
  async bulkMoveDataSources(@User() user, @Param('id') id, @Body() dto: BulkMoveDsDto) {
    return await this.folderDataSourcesService.bulkMoveDataSources(user, id, dto);
  }
}
