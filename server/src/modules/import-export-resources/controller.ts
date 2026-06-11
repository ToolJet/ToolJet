import { Controller, Post, UseGuards, Body, BadRequestException, Headers } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import { ExportResourcesDto } from '@dto/export-resources.dto';
import { ImportResourcesDto } from '@dto/import-resources.dto';
import { CloneResourcesDto } from '@dto/clone-resources.dto';
import { isVersionGreaterThan } from 'src/helpers/utils.helper';
import { APP_ERROR_TYPE } from 'src/helpers/error_type.constant';
import { ImportExportResourcesService } from './service';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FeatureAbilityGuard as AppFeatureAbilityGuard } from './ability/app/guard';
import { FeatureAbilityGuard as DataSourceFeatureAbilityGuard } from './ability/data-source/guard';
import { FEATURE_KEY } from './constants';
import { ResourceCountGuard } from '@modules/licensing/guards/resourceCount.guard';

@Controller({
  path: 'resources',
  version: '2',
})
@InitModule(MODULES.IMPORT_EXPORT_RESOURCES)
export class ImportExportResourcesController {
  constructor(protected importExportResourcesService: ImportExportResourcesService) {}

  @InitFeature(FEATURE_KEY.APP_RESOURCE_EXPORT)
  @UseGuards(JwtAuthGuard, AppFeatureAbilityGuard)
  @Post('/export')
  async export(
    @User() user,
    @Body() exportResourcesDto: ExportResourcesDto,
    @Headers('x-branch-id') branchId?: string
  ) {
    const result = await this.importExportResourcesService.export(user, exportResourcesDto, branchId);
    return {
      ...result,
      tooljet_version: globalThis.TOOLJET_VERSION,
    };
  }

  @InitFeature(FEATURE_KEY.APP_RESOURCE_IMPORT)
  @UseGuards(JwtAuthGuard, ResourceCountGuard, AppFeatureAbilityGuard, DataSourceFeatureAbilityGuard)
  @Post('/import')
  async import(
    @User() user,
    @Body() importResourcesDto: ImportResourcesDto,
    @Headers('x-branch-id') branchId?: string
  ) {
    const isNotCompatibleVersion = isVersionGreaterThan(importResourcesDto.tooljet_version, globalThis.TOOLJET_VERSION);
    if (isNotCompatibleVersion) {
      throw new BadRequestException(APP_ERROR_TYPE.IMPORT_EXPORT_SERVICE.UNSUPPORTED_VERSION_ERROR);
    }
    // Header takes precedence over body. Body's branchId is kept for backward
    // compatibility with callers that already plumb it that way (e.g. clone).
    if (branchId) importResourcesDto.branchId = branchId;
    const imports = await this.importExportResourcesService.import(user, importResourcesDto);
    return { imports, success: true };
  }

  @InitFeature(FEATURE_KEY.APP_RESOURCE_CLONE)
  @UseGuards(JwtAuthGuard, ResourceCountGuard, AppFeatureAbilityGuard, DataSourceFeatureAbilityGuard)
  @Post('/clone')
  async clone(@User() user, @Body() cloneResourcesDto: CloneResourcesDto) {
    const imports = await this.importExportResourcesService.clone(user, cloneResourcesDto);
    return { imports, success: true };
  }
}
