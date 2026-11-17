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
import { DataSourcesBulkService } from './bulk.service';
import { DataSourcesBulkFolderDeleteService } from './bulk-folder-delete.service';
import { DataSourcesDashboardService } from './dashboard.service';
import {
  BulkDeleteDataSourceFoldersDto,
  BulkDeleteDataSourcesDto,
  BulkMoveDataSourcesDto,
  BulkRemoveDataSourcesDto,
  BulkResultResponseDto,
} from './dto/bulk.dto';
import { ListDataSourcesV2QueryDto, ListDataSourcesV2ResponseDto } from './dto/list.dto';

@InitModule(MODULES.GLOBAL_DATA_SOURCE)
@Controller({ path: 'data-sources', version: '2' })
@UseInterceptors(ClassSerializerInterceptor)
export class DataSourcesDashboardController {
  constructor(
    private readonly dashboardService: DataSourcesDashboardService,
    private readonly bulkService: DataSourcesBulkService,
    private readonly bulkFolderDeleteService: DataSourcesBulkFolderDeleteService
  ) {}

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get()
  list(@User() user: UserEntity, @Query() query: ListDataSourcesV2QueryDto): Promise<ListDataSourcesV2ResponseDto> {
    return this.dashboardService.list(user, query);
  }

  // Bulk routes: coarse gate = listing; per-item checks run in the bulk services.
  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post('bulk-delete')
  @HttpCode(200)
  bulkDelete(@User() user: UserEntity, @Body() body: BulkDeleteDataSourcesDto): Promise<BulkResultResponseDto> {
    return this.bulkService.delete(user, body);
  }

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post('bulk-move')
  @HttpCode(200)
  bulkMove(@User() user: UserEntity, @Body() body: BulkMoveDataSourcesDto): Promise<BulkResultResponseDto> {
    return this.bulkService.move(user, body);
  }

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post('bulk-remove')
  @HttpCode(200)
  bulkRemove(@User() user: UserEntity, @Body() body: BulkRemoveDataSourcesDto): Promise<BulkResultResponseDto> {
    return this.bulkService.remove(user, body);
  }

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Post('folders/bulk-delete')
  @HttpCode(200)
  bulkDeleteFolders(
    @User() user: UserEntity,
    @Body() body: BulkDeleteDataSourceFoldersDto
  ): Promise<BulkResultResponseDto> {
    return this.bulkFolderDeleteService.delete(user, body);
  }
}
