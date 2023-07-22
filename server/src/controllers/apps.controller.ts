import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
  UseGuards,
  Body,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AppsService } from '../services/apps.service';
import { camelizeKeys, decamelizeKeys } from 'humps';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { AppAuthGuard } from 'src/modules/auth/app-auth.guard';
import { FoldersService } from '@services/folders.service';
import { App } from 'src/entities/app.entity';
import { User } from 'src/decorators/user.decorator';
import { AppUpdateDto } from '@dto/app-update.dto';
import { VersionCreateDto } from '@dto/version-create.dto';
import { VersionEditDto } from '@dto/version-edit.dto';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager } from 'typeorm';
import { ValidAppInterceptor } from 'src/interceptors/valid.app.interceptor';
import { AppDecorator } from 'src/decorators/app.decorator';

@Controller('apps')
export class AppsController {
  constructor(
    private appsService: AppsService,
    private foldersService: FoldersService,
    private appsAbilityFactory: AppsAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@User() user, @Body('icon') icon: string, @Body('type') type: string) {
    const ability = await this.appsAbilityFactory.appsActions(user);

    if (!ability.can('createApp', App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const app = await this.appsService.create(user, manager, type);

      const appUpdateDto = new AppUpdateDto();
      appUpdateDto.slug = app.id;
      appUpdateDto.icon = icon;
      await this.appsService.update(app.id, appUpdateDto, manager);

      return decamelizeKeys(app);
    });
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Get(':id')
  async show(@User() user, @AppDecorator() app: App, @Query('access_type') accessType: string) {
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);
    if (!ability.can('viewApp', app)) {
      throw new ForbiddenException(
        JSON.stringify({
          organizationId: app.organizationId,
        })
      );
    }

    if (accessType === 'edit' && !ability.can('editApp', app)) {
      throw new ForbiddenException(
        JSON.stringify({
          organizationId: app.organizationId,
        })
      );
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
  async appFromSlug(@User() user, @AppDecorator() app: App) {
    if (user) {
      const ability = await this.appsAbilityFactory.appsActions(user, app.id);

      if (!ability.can('viewApp', app)) {
        throw new ForbiddenException(
          JSON.stringify({
            organizationId: app.organizationId,
          })
        );
      }
    }

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
  @UseInterceptors(ValidAppInterceptor)
  @Put(':id')
  async update(@User() user, @AppDecorator() app: App, @Body('app') appUpdateDto: AppUpdateDto) {
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('updateParams', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const result = await this.appsService.update(app.id, appUpdateDto);
    const response = decamelizeKeys(result);

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Post(':id/clone')
  async clone(@User() user, @AppDecorator() app: App) {
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('cloneApp', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const result = await this.appsService.clone(app, user);
    const response = decamelizeKeys(result);

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Delete(':id')
  async delete(@User() user, @AppDecorator() app: App) {
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('deleteApp', app)) {
      throw new ForbiddenException('Only administrators are allowed to delete apps.');
    }

    await this.appsService.delete(app.id);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@User() user, @Query() query) {
    const page = query.page;
    const folderId = query.folder;
    const searchKey = query.searchKey || '';
    const type = query.type ?? 'front-end';

    let apps = [];
    let totalFolderCount = 0;

    if (folderId) {
      const folder = await this.foldersService.findOne(folderId);
      apps = await this.foldersService.getAppsFor(user, folder, page, searchKey, type);
      totalFolderCount = await this.foldersService.userAppCount(user, folder, searchKey, type);
    } else {
      apps = await this.appsService.all(user, page, searchKey, type);
    }

    const totalCount = await this.appsService.count(user, searchKey, type);

    const totalPageCount = folderId ? totalFolderCount : totalCount;

    const meta = {
      total_pages: Math.ceil(totalPageCount / 9),
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

    const result = await this.appsService.fetchUsers(id);
    return decamelizeKeys({ users: result });
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Get(':id/versions')
  async fetchVersions(@User() user, @AppDecorator() app: App) {
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('fetchVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const result = await this.appsService.fetchVersions(user, app.id);
    return { versions: result };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Post(':id/versions')
  async createVersion(@User() user, @AppDecorator() app: App, @Body() versionCreateDto: VersionCreateDto) {
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('createVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const appUser = await this.appsService.createVersion(
      user,
      app,
      versionCreateDto.versionName,
      versionCreateDto.versionFromId,
      versionCreateDto.environmentId
    );
    return decamelizeKeys(appUser);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Get(':id/versions/:versionId')
  async version(@User() user, @Param('id') id, @Param('versionId') versionId) {
    const appVersion = await this.appsService.findVersion(versionId);
    const app = appVersion.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('fetchVersions', app)) {
      throw new ForbiddenException(
        JSON.stringify({
          organizationId: app.organizationId,
        })
      );
    }

    return { ...appVersion, data_queries: appVersion.dataQueries };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Put(':id/versions/:versionId')
  async updateVersion(
    @User() user,
    @Param('id') id,
    @Param('versionId') versionId,
    @Body() versionEditDto: VersionEditDto
  ) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    await this.appsService.updateVersion(version, versionEditDto, app.organizationId);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Delete(':id/versions/:versionId')
  async deleteVersion(@User() user, @Param('id') id, @Param('versionId') versionId) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!version || !ability.can('deleteVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const numVersions = await this.appsService.getAppVersionsCount(id);
    if (numVersions <= 1) {
      throw new ForbiddenException('Cannot delete only version of app');
    }

    await this.appsService.deleteVersion(app, version);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Put(':id/icons')
  async updateIcon(@User() user, @AppDecorator() app: App, @Body('icon') icon) {
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('updateIcon', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const appUpdateDto = new AppUpdateDto();
    appUpdateDto.icon = icon;
    const appUser = await this.appsService.update(app.id, appUpdateDto);
    return decamelizeKeys(appUser);
  }
}
