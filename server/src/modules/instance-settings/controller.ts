import { Controller, Get, Post, UseGuards, Body, Delete, Param, Patch, NotFoundException } from '@nestjs/common';
import { CreateInstanceSettingsDto, UpdateUserSettingsDto } from './dto';
import { IInstanceSettingsController } from './Interfaces/IController';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';

@InitModule(MODULES.INSTANCE_SETTINGS)
@Controller('instance-settings')
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class InstanceSettingsController implements IInstanceSettingsController {
  constructor() {}

  @InitFeature(FEATURE_KEY.GET)
  @Get()
  async get(): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.CREATE)
  @Post()
  async create(@Body() body: CreateInstanceSettingsDto) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.UPDATE)
  @Patch()
  async update(@Body() body: UpdateUserSettingsDto) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.DELETE)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    throw new NotFoundException();
  }
}
