import { Body, Controller, Delete, HttpCode, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { User as UserEntity } from '@entities/user.entity';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { User } from '@modules/app/decorators/user.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FeatureAbilityGuard } from '../ability/guard';
import { FEATURE_KEY } from '../constants';
import { PinsService } from './pins.service';
import { BranchQueryDto, CreatePinsDto, ReorderPinsDto, UnpinParamsDto } from './dto/pins.dto';

// Coarse gate = app listing (everyone); per-item visibility is checked in PinsService.
@InitModule(MODULES.APP)
@Controller({ path: 'pins', version: '2' })
export class PinsController {
  constructor(private readonly pinsService: PinsService) {}

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post()
  @HttpCode(204)
  async pin(@User() user: UserEntity, @Body() body: CreatePinsDto): Promise<void> {
    await this.pinsService.pin(user, body);
  }

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Put('order')
  @HttpCode(204)
  async reorder(@User() user: UserEntity, @Body() body: ReorderPinsDto): Promise<void> {
    await this.pinsService.reorder(user, body);
  }

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Delete(':resource_type/:resource_id')
  @HttpCode(204)
  async unpin(
    @User() user: UserEntity,
    @Param() params: UnpinParamsDto,
    @Query() query: BranchQueryDto
  ): Promise<void> {
    await this.pinsService.unpin(user, params, query.branch_id);
  }
}
