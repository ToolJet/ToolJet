import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credential } from '../../../src/entities/credential.entity';
import { TooljetDbController } from '@controllers/tooljet_db.controller';
import { CaslModule } from '../casl/casl.module';
import { TooljetDbService } from '@services/tooljet_db.service';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { TooljetDbBulkUploadService } from '@services/tooljet_db_bulk_upload.service';
import { TooljetDbOperationsService } from '@services/tooljet_db_operations.service';
import { tooljetDbOrmconfig } from 'ormconfig';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Credential]),
    CaslModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      name: 'tooljetDb',
      useFactory: (config: ConfigService) => {
        if (config.get('ENABLE_TOOLJET_DB') === 'true') {
          return tooljetDbOrmconfig;
        }
        return {};
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [TooljetDbController],
  providers: [TooljetDbService, TooljetDbBulkUploadService, TooljetDbOperationsService, PostgrestProxyService],
  exports: [TooljetDbOperationsService],
})
export class TooljetDbModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const enableTooljetDb = this.configService.get('ENABLE_TOOLJET_DB') === 'true';
    console.log(`ToolJet Database enabled: ${enableTooljetDb}`);
  }
}
