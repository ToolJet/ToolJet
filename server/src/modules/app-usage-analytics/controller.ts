import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { User } from '@modules/app/decorators/user.decorator';
import { User as UserEntity } from '@entities/user.entity';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';
import { AppUsageAnalyticsService } from './service';
import {
  ActiveUsersSeriesResponseDto,
  AnalyticsRangeQueryDto,
  AnalyticsSeriesQueryDto,
  AnalyticsStatusResponseDto,
  AppSummaryResponseDto,
  AppUsersQueryDto,
  AppUsersResponseDto,
  WorkspaceAppsQueryDto,
  WorkspaceAppsResponseDto,
  WorkspaceSummaryResponseDto,
} from './dto';

/**
 * Read API for usage analytics. Every query is scoped by the caller's workspace
 * (`user.organizationId`), never by ids from the request alone. The service does the work;
 * in CE it answers 501.
 */
@Controller('analytics')
@InitModule(MODULES.APP_USAGE_ANALYTICS)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class AppUsageAnalyticsController {
  constructor(protected readonly analyticsService: AppUsageAnalyticsService) {}

  @Get('status')
  @InitFeature(FEATURE_KEY.GET_STATUS)
  async getStatus(@User() user: UserEntity): Promise<AnalyticsStatusResponseDto> {
    return plainToInstance(AnalyticsStatusResponseDto, await this.analyticsService.getStatus(user.organizationId));
  }

  @Get('workspace/summary')
  @InitFeature(FEATURE_KEY.GET_WORKSPACE_SUMMARY)
  async getWorkspaceSummary(
    @User() user: UserEntity,
    @Query() query: AnalyticsRangeQueryDto
  ): Promise<WorkspaceSummaryResponseDto> {
    return plainToInstance(
      WorkspaceSummaryResponseDto,
      await this.analyticsService.getWorkspaceSummary(user.organizationId, query)
    );
  }

  @Get('workspace/active-users')
  @InitFeature(FEATURE_KEY.GET_WORKSPACE_ACTIVE_USERS)
  async getWorkspaceActiveUsers(
    @User() user: UserEntity,
    @Query() query: AnalyticsSeriesQueryDto
  ): Promise<ActiveUsersSeriesResponseDto> {
    return plainToInstance(
      ActiveUsersSeriesResponseDto,
      await this.analyticsService.getWorkspaceActiveUsers(user.organizationId, query)
    );
  }

  @Get('workspace/apps')
  @InitFeature(FEATURE_KEY.GET_WORKSPACE_APPS)
  async getWorkspaceApps(
    @User() user: UserEntity,
    @Query() query: WorkspaceAppsQueryDto
  ): Promise<WorkspaceAppsResponseDto> {
    return plainToInstance(
      WorkspaceAppsResponseDto,
      await this.analyticsService.getWorkspaceApps(user.organizationId, query)
    );
  }

  @Get('apps/:appId/summary')
  @InitFeature(FEATURE_KEY.GET_APP_SUMMARY)
  async getAppSummary(
    @User() user: UserEntity,
    @Param('appId', ParseUUIDPipe) appId: string,
    @Query() query: AnalyticsRangeQueryDto
  ): Promise<AppSummaryResponseDto> {
    return plainToInstance(
      AppSummaryResponseDto,
      await this.analyticsService.getAppSummary(user.organizationId, appId, query)
    );
  }

  @Get('apps/:appId/active-users')
  @InitFeature(FEATURE_KEY.GET_APP_ACTIVE_USERS)
  async getAppActiveUsers(
    @User() user: UserEntity,
    @Param('appId', ParseUUIDPipe) appId: string,
    @Query() query: AnalyticsSeriesQueryDto
  ): Promise<ActiveUsersSeriesResponseDto> {
    return plainToInstance(
      ActiveUsersSeriesResponseDto,
      await this.analyticsService.getAppActiveUsers(user.organizationId, appId, query)
    );
  }

  @Get('apps/:appId/users')
  @InitFeature(FEATURE_KEY.GET_APP_USERS)
  async getAppUsers(
    @User() user: UserEntity,
    @Param('appId', ParseUUIDPipe) appId: string,
    @Query() query: AppUsersQueryDto
  ): Promise<AppUsersResponseDto> {
    return plainToInstance(
      AppUsersResponseDto,
      await this.analyticsService.getAppUsers(user.organizationId, appId, query)
    );
  }
}
