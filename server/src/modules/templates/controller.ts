import { AppCountGuard } from '@modules/licensing/guards/app.guard';
import { Controller, Post, UseGuards, Get, Body, Param } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { TemplateAppManifests } from 'src/../templates';
import { TemplatesService } from './service';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FeatureAbilityGuard } from './ability/guard';
import { FEATURE_KEY } from './constants';

@InitModule(MODULES.TEMPLATES)
@Controller('library_apps')
export class TemplateAppsController {
  constructor(protected templatesService: TemplatesService) {}

  @InitFeature(FEATURE_KEY.CREATE_LIBRARY_APP)
  @Post()
  @UseGuards(JwtAuthGuard, AppCountGuard, FeatureAbilityGuard)
  async create(
    @User() user,
    @Body('identifier') identifier,
    @Body('appName') appName,
    @Body('dependentPlugins') dependentPlugins,
    @Body('shouldAutoImportPlugin') shouldAutoImportPlugin
  ) {
    const newApp = await this.templatesService.perform(
      user,
      identifier,
      appName,
      dependentPlugins,
      shouldAutoImportPlugin
    );

    return newApp;
  }

  @InitFeature(FEATURE_KEY.CREATE_SAMPLE_APP)
  @Get('sample-app')
  @UseGuards(JwtAuthGuard, AppCountGuard, FeatureAbilityGuard)
  async createSampleApp(@User() user) {
    return await this.templatesService.createSampleApp(user);
  }

  @InitFeature(FEATURE_KEY.CREATE_SAMPLE_ONBOARD_APP)
  @Get('sample-onboard-app')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async createSampleOnboardApp(@User() user) {
    return await this.templatesService.createSampleOnboardApp(user);
  }

  @InitFeature(FEATURE_KEY.FETCH_TEMPLATES_LIST)
  @Get()
  @UseGuards(JwtAuthGuard)
  async index() {
    return { template_app_manifests: TemplateAppManifests };
  }

  @Get(':identifier/plugins')
  @UseGuards(JwtAuthGuard)
  async findDepedentPluginsFromTemplateDefinition(@Param('identifier') identifier) {
    const { pluginsToBeInstalled, pluginsListIdToDetailsMap } =
      await this.templatesService.findDepedentPluginsFromTemplateDefinition(identifier);
    return { plugins_to_be_installed: pluginsToBeInstalled, plugins_detail_by_id: pluginsListIdToDetailsMap };
  }
}
