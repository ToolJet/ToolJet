import { InitModule } from '@modules/app/decorators/init-module';
import { AppsService } from './service';
import { MODULES } from '@modules/app/constants/modules';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { Body, Controller, Delete, Get, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { AppCountGuard } from '@modules/licensing/guards/app.guard';
import { User } from '@modules/app/decorators/user.decorator';
import { User as UserEntity } from '@entities/user.entity';
import { AppCreateDto, AppListDto, AppUpdateDto, VersionReleaseDto } from './dto';
import { FeatureAbilityGuard } from './ability/guard';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { AbilityDecorator as Ability, AppAbility } from '@modules/app/decorators/ability.decorator';
import { AppDecorator as App } from '@modules/app/decorators/app.decorator';
import { App as AppEntity } from '@entities/app.entity';
import { AppAuthGuard } from './guards/app-auth.guard';
import { ValidSlugGuard } from './guards/valid-slug.guard';
import { ValidAppGuard } from './guards/valid-app.guard';
import { IAppsController } from './interfaces/IController';
import { AiCookies } from '@modules/auth/decorators/ai-cookie.decorator';
import { Response } from 'express';
import { isHttpsEnabled } from '@helpers/utils.helper';

@InitModule(MODULES.APP)
@Controller('apps')
export class AppsController implements IAppsController {
  constructor(protected readonly appsService: AppsService) {}

  @InitFeature(FEATURE_KEY.CREATE)
  @UseGuards(JwtAuthGuard, AppCountGuard, FeatureAbilityGuard)
  @Post()
  create(
    @User() user: UserEntity,
    @Body() appCreateDto: AppCreateDto,
    @Res({ passthrough: true }) response: Response,
    @AiCookies() cookies: Record<string, any>
  ) {
    // clear ai cookies
    // FIXME: can move this to service or middlewares
    if (cookies.tj_ai_prompt) {
      response.clearCookie('tj_ai_prompt', {
        secure: isHttpsEnabled(),
        httpOnly: true,
        sameSite: 'lax',
      });
    }
    if (cookies.tj_template_id) {
      response.clearCookie('tj_template_id', {
        secure: isHttpsEnabled(),
        httpOnly: true,
        sameSite: 'lax',
      });
    }

    return this.appsService.create(user, appCreateDto);
  }

  @InitFeature(FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS)
  @UseGuards(JwtAuthGuard, ValidSlugGuard, FeatureAbilityGuard)
  @Get('validate-private-app-access/:slug')
  validatePrivateAppAccess(
    @Query('version_name') versionName: string,
    @Query('environment_name') environmentName: string,
    @Query('version_id') versionId: string,
    @Query('environment_id') envId: string,
    @Ability() ability: AppAbility,
    @App() app: AppEntity
  ) {
    return this.appsService.validatePrivateAppAccess(app, ability, { versionName, environmentName, versionId, envId });
  }

  @InitFeature(FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS)
  @UseGuards(AppAuthGuard, FeatureAbilityGuard)
  @Get('validate-released-app-access/:slug')
  validateReleasedAppAccess(@Ability() ability: AppAbility, @App() app: AppEntity) {
    return this.appsService.validateReleasedApp(ability, app);
  }

  @InitFeature(FEATURE_KEY.UPDATE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Put(':id')
  update(@User() user, @App() app: AppEntity, @Body('app') appUpdateDto: AppUpdateDto) {
    return this.appsService.update(app, appUpdateDto, user);
  }

  @InitFeature(FEATURE_KEY.APP_PUBLIC_UPDATE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Put(':id/public')
  updatePublic(@User() user, @App() app: AppEntity, @Body('app') appUpdateDto: AppUpdateDto) {
    return this.appsService.update(app, appUpdateDto, user);
  }

  @InitFeature(FEATURE_KEY.DELETE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Delete(':id')
  delete(@User() user, @App() app: AppEntity) {
    return this.appsService.delete(app, user);
  }

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get()
  index(@User() user, @Query() query) {
    const AppListDto: AppListDto = {
      page: query.page,
      folderId: query.folder,
      searchKey: query.searchKey || '',
      type: query.type ?? 'front-end',
    };
    return this.appsService.getAllApps(user, AppListDto);
  }

  @InitFeature(FEATURE_KEY.UPDATE_ICON)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Put(':id/icons')
  async updateIcon(@User() user, @App() app: AppEntity, @Body('icon') icon) {
    const appUpdateDto = new AppUpdateDto();
    appUpdateDto.icon = icon;
    await this.appsService.update(app, appUpdateDto, user);
    return;
  }

  @InitFeature(FEATURE_KEY.UPDATE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get(':id/tables')
  async tables(@User() user, @App() app: AppEntity) {
    const result = await this.appsService.findTooljetDbTables(app.id);
    return { tables: result };
  }

  @InitFeature(FEATURE_KEY.GET_ONE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get(':id')
  show(@User() user: UserEntity, @App() app: AppEntity) {
    return this.appsService.getOne(app, user);
  }

  @InitFeature(FEATURE_KEY.GET_BY_SLUG)
  // This guard will allow access for unauthenticated user if the app is public
  @UseGuards(AppAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get('slugs/:slug')
  appFromSlug(@User() user, @App() app: AppEntity) {
    return this.appsService.getBySlug(app, user);
  }

  @InitFeature(FEATURE_KEY.RELEASE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Put(':id/release')
  releaseVersion(@User() user, @App() app: AppEntity, @Body() versionReleaseDto: VersionReleaseDto) {
    return this.appsService.release(app, user, versionReleaseDto);
  }

  // Metrics endpoints
  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(JwtAuthGuard)
  @Post('metrics/app-load-time')
  trackAppLoadTime(
    @User() user: UserEntity,
    @Body() data: { 
      appId: string; 
      loadTime: number; 
      appName?: string;
      environment?: string;
      mode?: string;
    }
  ) {
    const { trackAppLoadTime } = require('../../otel/business-metrics');
    
    const appContext = {
      appId: data.appId,
      appName: data.appName || 'Unknown App',
      organizationId: user.organizationId,
      userId: user.id,
      environment: data.environment || 'production'
    };
    
    const mode = data.mode || 'direct';
    trackAppLoadTime(appContext, data.loadTime * 1000, mode); // Convert seconds to milliseconds
    
    return { 
      success: true,
      message: 'App load time tracked successfully',
      data: {
        appId: data.appId,
        loadTime: data.loadTime,
        userId: user.id
      }
    };
  }

  // Test endpoint to manually trigger metrics
  @UseGuards(JwtAuthGuard)
  @Post('metrics/test')
  testMetrics(@User() user: UserEntity) {
    const { trackAppLoadTime, trackQueryExecution } = require('../../otel/business-metrics');
    
    const appContext = {
      appId: 'test-manual-app',
      appName: 'Manual Test App',
      organizationId: user.organizationId,
      userId: user.id,
      environment: 'test'
    };
    
    console.log('[ToolJet Backend] Manual test - tracking app load time:', appContext);
    trackAppLoadTime(appContext, 3.14 * 1000); // Convert seconds to milliseconds
    
    console.log('[ToolJet Backend] Manual test - tracking query execution:', appContext);
    trackQueryExecution(appContext, 'test_query', 250, 'success', 'postgresql');
    trackQueryExecution(appContext, 'slow_query', 5000, 'error', 'mysql');
    
    return { 
      success: true,
      message: 'Test metrics tracked successfully',
      data: {
        loadTime: 3.14,
        queries: [
          { name: 'test_query', duration: 250, status: 'success', datasource: 'postgresql' },
          { name: 'slow_query', duration: 5000, status: 'error', datasource: 'mysql' }
        ],
        userId: user.id
      }
    };
  }
}
