import { Controller, Post, UseGuards, Body, Delete, Param, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../session/guards/jwt-auth.guard';
import { CreateDsFolderDto, UpdateDsFolderDto } from './dto';
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

  @InitFeature(FEATURE_KEY.CREATE_DS_FOLDER)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post()
  async create(@User() user, @Body() createDsFolderDto: CreateDsFolderDto) {
    return await this.folderDataSourcesService.createFolder(user, createDsFolderDto);
  }

  @InitFeature(FEATURE_KEY.UPDATE_DS_FOLDER)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Put(':id')
  async update(@User() user, @Param('id') id, @Body() updateDsFolderDto: UpdateDsFolderDto) {
    return await this.folderDataSourcesService.renameFolder(user, id, updateDsFolderDto);
  }

  @InitFeature(FEATURE_KEY.DELETE_DS_FOLDER)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Delete(':id')
  async delete(@User() user, @Param('id') id) {
    return await this.folderDataSourcesService.deleteFolder(user, id);
  }
}
