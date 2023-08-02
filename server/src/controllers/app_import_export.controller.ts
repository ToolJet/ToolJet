import { Controller, ForbiddenException, Get, Param, Post, Query, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AppsService } from '../services/apps.service';
import { decamelizeKeys } from 'humps';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { App } from 'src/entities/app.entity';
import { AppImportExportService } from '@services/app_import_export.service';
import { User } from 'src/decorators/user.decorator';
import { AuditLoggerService } from '@services/audit_logger.service';
import { ActionTypes, ResourceTypes } from 'src/entities/audit_log.entity';
import { AppCountGuard } from '@ee/licensing/guards/app.guard';

@Controller('apps')
export class AppsImportExportController {
  constructor(
    private appsService: AppsService,
    private appImportExportService: AppImportExportService,
    private appsAbilityFactory: AppsAbilityFactory,
    private auditLoggerService: AuditLoggerService
  ) {}

  @UseGuards(JwtAuthGuard, AppCountGuard)
  @Post('/import')
  async import(@User() user, @Body() body) {
    const ability = await this.appsAbilityFactory.appsActions(user);

    if (!ability.can('createApp', App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const app = await this.appImportExportService.import(user, body);

    await this.auditLoggerService.perform({
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: app.id,
      resourceType: ResourceTypes.APP,
      resourceName: app.name,
      actionType: ActionTypes.APP_IMPORT,
    });

    return decamelizeKeys(app);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/export')
  async export(@User() user, @Param('id') id, @Query() query) {
    const appToExport = await this.appsService.find(id);
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('cloneApp', appToExport)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const app = await this.appImportExportService.export(user, id, query);

    await this.auditLoggerService.perform({
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: app.appV2.id,
      resourceType: ResourceTypes.APP,
      resourceName: app.appV2.name,
      actionType: ActionTypes.APP_EXPORT,
    });

    return {
      ...app,
      tooljetVersion: globalThis.TOOLJET_VERSION,
    };
  }
}
