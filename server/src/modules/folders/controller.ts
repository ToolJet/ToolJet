import { Controller, Post, UseGuards, Body, Delete, Param, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../session/guards/jwt-auth.guard';
import { CreateFolderDto, UpdateFolderDto } from '@modules/folders/dto';
import { User } from '@modules/app/decorators/user.decorator';
import { FoldersService } from '@modules/folders/service';
import { IFoldersController } from './interfaces/IController';
import { FEATURE_KEY } from './constants';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FeatureAbilityGuard } from './ability/guard';

@InitModule(MODULES.FOLDER)
@Controller('folders')
export class FoldersController implements IFoldersController {
  constructor(protected foldersService: FoldersService) {}

  @InitFeature(FEATURE_KEY.CREATE_FOLDER)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post()
  async create(@User() user, @Body() createFolderDto: CreateFolderDto) {
    return await this.foldersService.createFolder(user, createFolderDto);
  }

  @InitFeature(FEATURE_KEY.UPDATE_FOLDER)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Put(':id')
  async update(@User() user, @Param('id') id, @Body() updateFolderDto: UpdateFolderDto) {
    return await this.foldersService.updateFolder(user, id, updateFolderDto);
  }

  @InitFeature(FEATURE_KEY.DELETE_FOLDER)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Delete(':id')
  async delete(@User() user, @Param('id') id) {
    return await this.foldersService.deleteFolder(user, id);
  }
}
