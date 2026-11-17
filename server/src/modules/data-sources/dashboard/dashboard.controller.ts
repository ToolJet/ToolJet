import { ClassSerializerInterceptor, Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { User as UserEntity } from '@entities/user.entity';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { User } from '@modules/app/decorators/user.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FeatureAbilityGuard } from '../ability/guard';
import { FEATURE_KEY } from '../constants';
import { DataSourcesDashboardService } from './dashboard.service';
import { ListDataSourcesV2QueryDto, ListDataSourcesV2ResponseDto } from './dto/list.dto';

@InitModule(MODULES.GLOBAL_DATA_SOURCE)
@Controller({ path: 'data-sources', version: '2' })
@UseInterceptors(ClassSerializerInterceptor)
export class DataSourcesDashboardController {
  constructor(private readonly dashboardService: DataSourcesDashboardService) {}

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get()
  list(@User() user: UserEntity, @Query() query: ListDataSourcesV2QueryDto): Promise<ListDataSourcesV2ResponseDto> {
    return this.dashboardService.list(user, query);
  }
}
