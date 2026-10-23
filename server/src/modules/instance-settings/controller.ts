import {
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  Body,
  Delete,
  Param,
  Patch,
  NotFoundException,
  HttpCode,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import {
  CreateInstanceSettingsDto,
  SsrfSettingsResponseDto,
  UpdateSsrfSettingsDto,
  UpdateUserSettingsDto,
} from './dto';
import { IInstanceSettingsController } from './Interfaces/IController';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';
import { User as UserEntity } from '@entities/user.entity';
import { User } from '@modules/app/decorators/user.decorator';

@InitModule(MODULES.INSTANCE_SETTINGS)
@Controller('instance-settings')
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
@UseInterceptors(ClassSerializerInterceptor)
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
  async update(@Body() body: UpdateUserSettingsDto, @User() user: UserEntity) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.DELETE)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.SSRF_GET)
  @Get('ssrf')
  async getSsrfSettings(): Promise<SsrfSettingsResponseDto> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.SSRF_UPDATE)
  @Put('ssrf')
  async updateSsrfSettings(@Body() body: UpdateSsrfSettingsDto): Promise<SsrfSettingsResponseDto> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.SSRF_UPDATE)
  @Post('ssrf/dismiss-notice')
  @HttpCode(204)
  async dismissSsrfUpgradeNotice(): Promise<void> {
    throw new NotFoundException();
  }
}
