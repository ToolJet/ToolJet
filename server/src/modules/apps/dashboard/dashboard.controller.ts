import { ClassSerializerInterceptor, Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { User as UserEntity } from '@entities/user.entity';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { User } from '@modules/app/decorators/user.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FeatureAbilityGuard } from '../ability/guard';
import { FEATURE_KEY } from '../constants';
import { DashboardService } from './dashboard.service';
import { ListAppsV2QueryDto, ListAppsV2ResponseDto } from './dto/list.dto';

@InitModule(MODULES.APP)
@Controller({ path: 'apps', version: '2' })
@UseInterceptors(ClassSerializerInterceptor)
export class DashboardAppsController {
  constructor(private readonly dashboardService: DashboardService) {}

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get()
  list(@User() user: UserEntity, @Query() query: ListAppsV2QueryDto): Promise<ListAppsV2ResponseDto> {
    return this.dashboardService.list(user, query);
  }
}
