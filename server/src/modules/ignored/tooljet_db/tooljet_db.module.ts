import { Module, OnModuleInit } from '@nestjs/common';
import { InjectEntityManager, TypeOrmModule } from '@nestjs/typeorm';
import { Credential } from '../../../src/entities/credential.entity';
import { TooljetDbController } from '@controllers/tooljet_db.controller';
import { CaslModule } from '../casl/casl.module';
import { TooljetDbService } from '@services/tooljet_db.service';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { InternalTable } from 'src/entities/internal_table.entity';
import { AppUser } from 'src/entities/app_user.entity';
import { TableCountGuard } from '@modules/licensing/guards/table.guard';
import { TooljetDbBulkUploadService } from '@services/tooljet_db_bulk_upload.service';
import { TooljetDbOperationsService } from '@services/tooljet_db_operations.service';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import { reconfigurePostgrest } from './utils/helper';
import { Logger } from 'nestjs-pino';

@Module({
  imports: [TypeOrmModule.forFeature([Credential, InternalTable, AppUser]), CaslModule],
  controllers: [TooljetDbController],
  providers: [
    TooljetDbService,
    TooljetDbBulkUploadService,
    TooljetDbOperationsService,
    PostgrestProxyService,
    TableCountGuard,
  ],
  exports: [TooljetDbService, TooljetDbBulkUploadService, TooljetDbOperationsService, PostgrestProxyService],
})
export class TooljetDbModule implements OnModuleInit {
  constructor(
    private logger: Logger,
    private configService: ConfigService,
    @InjectEntityManager('tooljetDb')
    private readonly tooljetDbManager: EntityManager
  ) {}

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
