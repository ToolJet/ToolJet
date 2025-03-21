import { DynamicModule, OnModuleInit } from '@nestjs/common';
import { InjectEntityManager, TypeOrmModule } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { Credential } from '../../../src/entities/credential.entity';
import { InternalTable } from 'src/entities/internal_table.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { reconfigurePostgrest } from './helper';
import { TableCountGuard } from '@modules/licensing/guards/table.guard';
import { getImportPath } from '@modules/app/constants';
import { AbilityUtilService } from '@modules/ability/util.service';
import { RolesRepository } from '@modules/roles/repository';
import { FeatureAbilityFactory } from './ability';

export class TooljetDbModule implements OnModuleInit {
  constructor(
    private logger: Logger,
    private configService: ConfigService,
    @InjectEntityManager('tooljetDb')
    private readonly tooljetDbManager: EntityManager
  ) {}

  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);

    const { TooljetDbController } = await import(`${importPath}/tooljet-db/controller`);
    const { TooljetDbTableOperationsService } = await import(
      `${importPath}/tooljet-db/services/tooljet-db-table-operations.service`
    );
    const { TooljetDbBulkUploadService } = await import(
      `${importPath}/tooljet-db/services/tooljet-db-bulk-upload.service`
    );
    const { TooljetDbDataOperationsService } = await import(
      `${importPath}/tooljet-db/services/tooljet-db-data-operations.service`
    );
    const { TooljetDbImportExportService } = await import(
      `${importPath}/tooljet-db/services/tooljet-db-import-export.service`
    );
    const { PostgrestProxyService } = await import(`${importPath}/tooljet-db/services/postgrest-proxy.service`);

    return {
      module: TooljetDbModule,
      imports: [TypeOrmModule.forFeature([Credential, InternalTable, AppUser, RolesRepository])],
      controllers: [TooljetDbController],
      providers: [
        AbilityUtilService,
        TooljetDbTableOperationsService,
        TooljetDbBulkUploadService,
        TooljetDbDataOperationsService,
        TooljetDbImportExportService,
        PostgrestProxyService,
        TableCountGuard,
        FeatureAbilityFactory,
      ],
      exports: [
        TooljetDbTableOperationsService,
        TooljetDbBulkUploadService,
        TooljetDbDataOperationsService,
        TooljetDbImportExportService,
      ],
    };
  }

  async onModuleInit() {
    if (!process.env.WORKER) {
      const tooljtDbUser = this.configService.get('TOOLJET_DB_USER');
      const statementTimeout = this.configService.get('TOOLJET_DB_STATEMENT_TIMEOUT') || 60000;
      const statementTimeoutInSecs = Number.isNaN(Number(statementTimeout)) ? 60 : Number(statementTimeout) / 1000;

      await reconfigurePostgrest(this.tooljetDbManager, {
        user: tooljtDbUser,
        enableAggregates: true,
        statementTimeoutInSecs: statementTimeoutInSecs,
      });
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
    }
  }
}
