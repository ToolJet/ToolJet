import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';
import { SsrfSettingsResponseDto, UpdateSsrfSettingsDto } from './dto';

// Path kept from when these routes lived on the instance-settings controller, so the settings page and CI
// scripts keep working.
@InitModule(MODULES.SSRF)
@Controller('instance-settings/ssrf')
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class SsrfController {
  @InitFeature(FEATURE_KEY.GET)
  @Get()
  async getSettings(): Promise<SsrfSettingsResponseDto> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.UPDATE)
  @Put()
  async updateSettings(@Body() body: UpdateSsrfSettingsDto): Promise<SsrfSettingsResponseDto> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.UPDATE)
  @Post('dismiss-notice')
  @HttpCode(204)
  async dismissUpgradeNotice(): Promise<void> {
    throw new NotFoundException();
  }
}
