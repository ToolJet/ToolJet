import { InitModule } from '@modules/app/decorators/init-module';
import { AppsService } from './service';
import { MODULES } from '@modules/app/constants/modules';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
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
import { AppAuthGuard } from '@modules/apps/guards/app-auth.guard';
import { ValidSlugGuard } from './guards/valid-slug.guard';
import { ValidAppGuard } from './guards/valid-app.guard';
import { IAppsController } from './interfaces/IController';

@InitModule(MODULES.APP)
@Controller('apps')
export class AppsController implements IAppsController {
  constructor(protected readonly appsService: AppsService) {}

  @InitFeature(FEATURE_KEY.CREATE)
  @UseGuards(JwtAuthGuard, AppCountGuard, FeatureAbilityGuard)
  @Post()
  create(@User() user: UserEntity, @Body() appCreateDto: AppCreateDto) {
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
}
