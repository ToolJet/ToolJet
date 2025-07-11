import { DynamicModule, OnModuleInit } from '@nestjs/common';
import { InjectEntityManager, TypeOrmModule } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { Credential } from '../../../src/entities/credential.entity';
import { InternalTable } from 'src/entities/internal_table.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { reconfigurePostgrest, reconfigurePostgrestWithoutSchemaSync } from './helper';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { TableCountGuard } from '@modules/licensing/guards/table.guard';
import { AbilityUtilService } from '@modules/ability/util.service';
import { RolesRepository } from '@modules/roles/repository';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';
import { isSQLModeDisabled } from '@helpers/tooljet_db.helper';

export class TooljetDbModule extends SubModule implements OnModuleInit {
  constructor(
    private logger: Logger,
    private configService: ConfigService,
    @InjectEntityManager('tooljetDb')
    private readonly tooljetDbManager: EntityManager
  ) {
    super();
  }

  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const {
      TooljetDbController,
      TooljetDbTableOperationsService,
      TooljetDbBulkUploadService,
      TooljetDbDataOperationsService,
      TooljetDbImportExportService,
      PostgrestProxyService,
    } = await this.getProviders(configs, 'tooljet-db', [
      'controller',
      'services/tooljet-db-table-operations.service',
      'services/tooljet-db-bulk-upload.service',
      'services/tooljet-db-data-operations.service',
      'services/tooljet-db-import-export.service',
      'services/postgrest-proxy.service',
    ]);

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

      if (isSQLModeDisabled()) {
        await reconfigurePostgrestWithoutSchemaSync(this.tooljetDbManager, {
          user: tooljtDbUser,
          enableAggregates: true,
          statementTimeoutInSecs: statementTimeoutInSecs,
        });
      } else {
        await reconfigurePostgrest(this.tooljetDbManager, {
          user: tooljtDbUser,
          enableAggregates: true,
          statementTimeoutInSecs: statementTimeoutInSecs,
        });
      }

      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
    }
  }
}
