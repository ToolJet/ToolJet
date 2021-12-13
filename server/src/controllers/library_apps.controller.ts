import { Controller, Post, Request, Param, UseGuards, Get, ForbiddenException } from '@nestjs/common';
import { LibraryAppCreationService } from '@services/library_app_creation.service';
import { App } from 'src/entities/app.entity';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { TemplateAppManifests } from '../../templates';

@Controller('library_apps')
export class LibraryAppsController {
  constructor(
    private libraryAppCreationService: LibraryAppCreationService,
    private appsAbilityFactory: AppsAbilityFactory
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Param() _params) {
    const ability = await this.appsAbilityFactory.appsActions(req.user, {});

    if (!ability.can('createApp', App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const { identifier } = req.body;
    const newApp = await this.libraryAppCreationService.perform(req.user, identifier);

    return newApp;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async index(@Request() _req, @Param() _params) {
    return { template_app_manifests: TemplateAppManifests };
  }
}
