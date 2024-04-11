import { Controller, Post, UseGuards, Body, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { ExportResourcesDto } from '@dto/export-resources.dto';
import { ImportResourcesDto } from '@dto/import-resources.dto';
import { ImportExportResourcesService } from '@services/import_export_resources.service';
import { App } from 'src/entities/app.entity';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { CloneResourcesDto } from '@dto/clone-resources.dto';
import { checkVersionCompatibility } from 'src/helpers/utils.helper';
import { APP_ERROR_TYPE } from 'src/helpers/error_type.constant';

@Controller({
  path: 'resources',
  version: '2',
})
export class ImportExportResourcesController {
  constructor(
    private importExportResourcesService: ImportExportResourcesService,
    private appsAbilityFactory: AppsAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('/export')
  async export(@User() user, @Body() exportResourcesDto: ExportResourcesDto) {
    const ability = await this.appsAbilityFactory.appsActions(user);

    if (!ability.can('createApp', App)) {
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
    const ability = await this.appsAbilityFactory.appsActions(user);

    if (!ability.can('importApp', App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const isNotCompatibleVersion = !checkVersionCompatibility(importResourcesDto.tooljet_version);
    if (isNotCompatibleVersion) {
      throw new BadRequestException(APP_ERROR_TYPE.IMPORT_EXPORT_SERVICE.UNSUPPORTED_VERSION_ERROR);
    }
    const imports = await this.importExportResourcesService.import(user, importResourcesDto);
    return { imports, success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/clone')
  async clone(@User() user, @Body() cloneResourcesDto: CloneResourcesDto) {
    const ability = await this.appsAbilityFactory.appsActions(user, cloneResourcesDto?.app?.[0]?.id);

    if (!ability.can('cloneApp', App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const imports = await this.importExportResourcesService.clone(user, cloneResourcesDto);
    return { imports, success: true };
  }
}
