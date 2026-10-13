import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { User as UserEntity } from '@entities/user.entity';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { User } from '@modules/app/decorators/user.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FeatureAbilityGuard } from '../ability/guard';
import { FEATURE_KEY } from '../constants';
import { BulkDeleteService } from './bulk-delete.service';
import { DashboardService } from './dashboard.service';
import { BulkDeleteAppsDto, BulkResultResponseDto } from './dto/bulk.dto';
import { ListAppsV2QueryDto, ListAppsV2ResponseDto } from './dto/list.dto';

@InitModule(MODULES.APP)
@Controller({ path: 'apps', version: '2' })
@UseInterceptors(ClassSerializerInterceptor)
export class DashboardAppsController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly bulkDeleteService: BulkDeleteService
  ) {}

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get()
  list(@User() user: UserEntity, @Query() query: ListAppsV2QueryDto): Promise<ListAppsV2ResponseDto> {
    return this.dashboardService.list(user, query);
  }

  // Coarse gate = app listing, as for bulk move; per-app checks run in BulkDeleteService.
  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post('bulk-delete')
  @HttpCode(200)
  bulkDelete(@User() user: UserEntity, @Body() body: BulkDeleteAppsDto): Promise<BulkResultResponseDto> {
    return this.bulkDeleteService.delete(user, body);
  }
}
