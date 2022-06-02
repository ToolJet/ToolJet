import { Controller, ForbiddenException, Get, Param, Post, Put, Delete, Query, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AppsService } from '../services/apps.service';
import { camelizeKeys, decamelizeKeys } from 'humps';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { AppAuthGuard } from 'src/modules/auth/app-auth.guard';
import { FoldersService } from '@services/folders.service';
import { App } from 'src/entities/app.entity';
import { AppImportExportService } from '@services/app_import_export.service';
import { User } from 'src/decorators/user.decorator';
import { AppUpdateDto } from '@dto/app-update.dto';
import { VersionCreateDto } from '@dto/version-create.dto';

@Controller('apps')
export class AppsController {
  constructor(
    private appsService: AppsService,
    private appImportExportService: AppImportExportService,
    private foldersService: FoldersService,
    private appsAbilityFactory: AppsAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@User() user) {
    const ability = await this.appsAbilityFactory.appsActions(user);

    if (!ability.can('createApp', App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const app = await this.appsService.create(user);

    const appUpdateDto = new AppUpdateDto();
    appUpdateDto.slug = app.id;
    await this.appsService.update(user, app.id, appUpdateDto);

    return decamelizeKeys(app);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async show(@User() user, @Param('id') id) {
    const app = await this.appsService.find(id);
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('viewApp', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const response = decamelizeKeys(app);

    const seralizedQueries = [];
    const dataQueriesForVersion = app.editingVersion
      ? await this.appsService.findDataQueriesForVersion(app.editingVersion.id)
      : [];

    // serialize queries
    for (const query of dataQueriesForVersion) {
      const decamelizedQuery = decamelizeKeys(query);
      decamelizedQuery['options'] = query.options;
      seralizedQueries.push(decamelizedQuery);
    }

    response['data_queries'] = seralizedQueries;
    response['definition'] = app.editingVersion?.definition;

    //! if editing version exists, camelize the definition
    if (app.editingVersion && app.editingVersion.definition) {
      response['editing_version'] = {
        ...response['editing_version'],
        definition: camelizeKeys(app.editingVersion.definition),
      };
    }
    return response;
  }

  @UseGuards(AppAuthGuard) // This guard will allow access for unauthenticated user if the app is public
  @Get('slugs/:slug')
  async appFromSlug(@User() user, @Param('slug') slug) {
    if (user) {
      const app = await this.appsService.findBySlug(slug);
      const ability = await this.appsAbilityFactory.appsActions(user, app.id);

      if (!ability.can('viewApp', app)) {
        throw new ForbiddenException('You do not have permissions to perform this action');
      }
    }

    const app = await this.appsService.findBySlug(slug);
    const versionToLoad = app.currentVersionId
      ? await this.appsService.findVersion(app.currentVersionId)
      : await this.appsService.findVersion(app.editingVersion?.id);

    // serialize
    return {
      current_version_id: app['currentVersionId'],
      data_queries: versionToLoad?.dataQueries,
      definition: versionToLoad?.definition,
      is_public: app.isPublic,
      is_maintenance_on: app.isMaintenanceOn,
      name: app.name,
      slug: app.slug,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@User() user, @Param('id') id, @Body('app') appUpdateDto: AppUpdateDto) {
    const app = await this.appsService.find(id);
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateParams', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const result = await this.appsService.update(user, id, appUpdateDto);
    const response = decamelizeKeys(result);

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/clone')
  async clone(@User() user, @Param('id') id) {
    const existingApp = await this.appsService.find(id);
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('cloneApp', existingApp)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const result = await this.appsService.clone(existingApp, user);
    const response = decamelizeKeys(result);

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/export')
  async export(@User() user, @Param('id') id) {
    const appToExport = await this.appsService.find(id);
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('viewApp', appToExport)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const app = await this.appImportExportService.export(user, id);
    return {
      ...app,
      tooljetVersion: globalThis.TOOLJET_VERSION,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/import')
  async import(@User() user, @Body() body) {
    const ability = await this.appsAbilityFactory.appsActions(user);

    if (!ability.can('createApp', App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    await this.appImportExportService.import(user, body);

    return;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@User() user, @Param('id') id) {
    const app = await this.appsService.find(id);
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('deleteApp', app)) {
      throw new ForbiddenException('Only administrators are allowed to delete apps.');
    }

    const result = await this.appsService.delete(id);
    const response = decamelizeKeys(result);

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@User() user, @Query() query) {
    const page = query.page;
    const folderId = query.folder;
    const searchKey = query.searchKey || '';

    let apps = [];
    let totalFolderCount = 0;

    if (folderId) {
      const folder = await this.foldersService.findOne(folderId);
      apps = await this.foldersService.getAppsFor(user, folder, page, searchKey);
      totalFolderCount = await this.foldersService.userAppCount(user, folder, searchKey);
    } else {
      apps = await this.appsService.all(user, page, searchKey);
    }
    //remove password from user info
    apps.forEach((app) => (app.user.password = undefined));

    const totalCount = await this.appsService.count(user, searchKey);

    const totalPageCount = folderId ? totalFolderCount : totalCount;

    const meta = {
      total_pages: Math.ceil(totalPageCount / 10),
      total_count: totalCount,
      folder_count: totalFolderCount,
      current_page: parseInt(page || 1),
    };

    const response = {
      meta,
      apps,
    };

    return decamelizeKeys(response);
  }

  // deprecated
  @UseGuards(JwtAuthGuard)
  @Get(':id/users')
  async fetchUsers(@User() user, @Param('id') id) {
    const app = await this.appsService.find(id);
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('fetchUsers', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const result = await this.appsService.fetchUsers(user, id);
    return decamelizeKeys({ users: result });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/versions')
  async fetchVersions(@User() user, @Param('id') id) {
    const app = await this.appsService.find(id);
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('fetchVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const result = await this.appsService.fetchVersions(user, id);
    return { versions: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/versions')
  async createVersion(@User() user, @Param('id') id, @Body() versionCreateDto: VersionCreateDto) {
    const app = await this.appsService.find(id);
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('createVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const appUser = await this.appsService.createVersion(
      user,
      app,
      versionCreateDto.versionName,
      versionCreateDto.versionFromId
    );
    return decamelizeKeys(appUser);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/versions/:versionId')
  async version(@User() user, @Param('id') id, @Param('versionId') versionId) {
    const app = await this.appsService.find(id);
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('fetchVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const appVersion = await this.appsService.findVersion(versionId);

    return { ...appVersion, data_queries: appVersion.dataQueries };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/versions/:versionId')
  async updateVersion(@User() user, @Param('id') id, @Param('versionId') versionId, @Body() body) {
    const version = await this.appsService.findVersion(versionId);
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', version.app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const appUser = await this.appsService.updateVersion(user, version, body);
    return decamelizeKeys(appUser);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/versions/:versionId')
  async deleteVersion(@User() user, @Param('id') id, @Param('versionId') versionId) {
    const version = await this.appsService.findVersion(versionId);
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!version || !ability.can('deleteVersions', version.app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    return await this.appsService.deleteVersion(version.app, version);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/icons')
  async updateIcon(@User() user, @Param('id') id, @Body('icon') icon) {
    const app = await this.appsService.find(id);
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateIcon', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const appUpdateDto = new AppUpdateDto();
    appUpdateDto.icon = icon;
    const appUser = await this.appsService.update(user, id, appUpdateDto);
    return decamelizeKeys(appUser);
  }
}
