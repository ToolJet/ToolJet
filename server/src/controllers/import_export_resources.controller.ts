import { Controller, Post, UseGuards, Body, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { ExportResourcesDto } from '@dto/export-resources.dto';
import { ImportResourcesDto } from '@dto/import-resources.dto';
import { ImportExportResourcesService } from '@services/import_export_resources.service';
import { App } from 'src/entities/app.entity';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { CloneResourcesDto } from '@dto/clone-resources.dto';
import { GlobalDataSourceAbilityFactory } from 'src/modules/casl/abilities/global-datasource-ability.factory';
import { DataSource } from 'src/entities/data_source.entity';
import { isVersionGreaterThan } from 'src/helpers/utils.helper';
import { APP_ERROR_TYPE } from 'src/helpers/error_type.constant';
import { APP_RESOURCE_ACTIONS, GLOBAL_DATA_SOURCE_RESOURCE_ACTIONS } from 'src/constants/global.constant';

@Controller({
  path: 'resources',
  version: '2',
})
export class ImportExportResourcesController {
  constructor(
    private importExportResourcesService: ImportExportResourcesService,
    private globalDataSourceAbilityFactory: GlobalDataSourceAbilityFactory,
    private appsAbilityFactory: AppsAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('/export')
  async export(@User() user, @Body() exportResourcesDto: ExportResourcesDto) {
    const ability = await this.appsAbilityFactory.appsActions(user, exportResourcesDto?.app?.[0]?.id);

    if (!ability.can(APP_RESOURCE_ACTIONS.EXPORT, App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const result = await this.importExportResourcesService.export(user, exportResourcesDto);
    return {
      ...result,
      tooljet_version: globalThis.TOOLJET_VERSION,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/import')
  async import(@User() user, @Body() importResourcesDto: ImportResourcesDto) {
    const appAbility = await this.appsAbilityFactory.appsActions(user);
    const gdsAbility = await this.globalDataSourceAbilityFactory.globalDataSourceActions(user);

    if (!appAbility.can(APP_RESOURCE_ACTIONS.IMPORT, App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const importHasGlobalDatasource = importResourcesDto.app[0]?.definition?.appV2?.dataSources.find(
      (ds) => ds.scope === 'global'
    );

    if (importHasGlobalDatasource && !gdsAbility.can(GLOBAL_DATA_SOURCE_RESOURCE_ACTIONS.CREATE, DataSource)) {
      throw new ForbiddenException('You do not have create datasource permissions to perform this action');
    }
    const isNotCompatibleVersion = isVersionGreaterThan(importResourcesDto.tooljet_version, globalThis.TOOLJET_VERSION);
    if (isNotCompatibleVersion) {
      throw new BadRequestException(APP_ERROR_TYPE.IMPORT_EXPORT_SERVICE.UNSUPPORTED_VERSION_ERROR);
    }
    const imports = await this.importExportResourcesService.import(user, importResourcesDto);
    return { imports, success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/clone')
  async clone(@User() user, @Body() cloneResourcesDto: CloneResourcesDto) {
    const appAbility = await this.appsAbilityFactory.appsActions(user, cloneResourcesDto?.app?.[0]?.id);
    const gdsAbility = await this.globalDataSourceAbilityFactory.globalDataSourceActions(user);

    if (!appAbility.can(APP_RESOURCE_ACTIONS.CLONE, App)) {
      throw new ForbiddenException('You do not have app create permissions to perform this action');
    }

    if (!gdsAbility.can(GLOBAL_DATA_SOURCE_RESOURCE_ACTIONS.CREATE, DataSource)) {
      throw new ForbiddenException('You do not have create datasource permissions to perform this action');
    }

    const imports = await this.importExportResourcesService.clone(user, cloneResourcesDto);
    return { imports, success: true };
  }
}
