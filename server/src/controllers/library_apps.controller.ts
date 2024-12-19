import { Controller, Post, UseGuards, Get, ForbiddenException, Body } from '@nestjs/common';
import { LibraryAppCreationService } from '@services/library_app_creation.service';
import { User } from 'src/decorators/user.decorator';
import { App } from 'src/entities/app.entity';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { TemplateAppManifests } from '../../templates';
import { APP_RESOURCE_ACTIONS } from 'src/constants/global.constant';

@Controller('library_apps')
export class LibraryAppsController {
  constructor(
    private libraryAppCreationService: LibraryAppCreationService,
    private appsAbilityFactory: AppsAbilityFactory
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @User() user,
    @Body('identifier') identifier,
    @Body('appName') appName,
    @Body('dependentPluginsForTemplate') dependentPluginsForTemplate,
    @Body('shouldAutoImportPlugin') shouldAutoImportPlugin
  ) {
    const ability = await this.appsAbilityFactory.appsActions(user);

    if (!ability.can(APP_RESOURCE_ACTIONS.CREATE, App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const newApp = await this.libraryAppCreationService.perform(
      user,
      identifier,
      appName,
      dependentPluginsForTemplate,
      shouldAutoImportPlugin
    );

    return newApp;
  }

  @Get('sample-app')
  @UseGuards(JwtAuthGuard)
  async createSampleApp(@User() user) {
    return await this.libraryAppCreationService.createSampleApp(user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async index() {
    return { template_app_manifests: TemplateAppManifests };
  }

  @Post('find_depedent_plugins')
  @UseGuards(JwtAuthGuard)
  async findDepedentPluginsFromTemplateDefinition(@Body('identifier') identifier) {
    const plugins_to_be_installed = await this.libraryAppCreationService.findDepedentPluginsFromTemplateDefinition(
      identifier
    );
    return { plugins_to_be_installed };
  }
}
