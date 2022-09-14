import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CredentialsService } from "@services/credentials.service";
import { DataSourcesService } from "@services/data_sources.service";
import { EncryptionService } from "@services/encryption.service";
import { WorkspaceDbSetupService } from "@services/workspace_db_setup.service";
import { Credential } from "src/entities/credential.entity";
import { DataSource } from "src/entities/data_source.entity";
import { SeedsService } from "../../services/seeds.service";

@Module({
  imports: [TypeOrmModule.forFeature([DataSource, Credential])],
  providers: [
    SeedsService,
    WorkspaceDbSetupService,
    DataSourcesService,
    CredentialsService,
    EncryptionService,
  ],
  exports: [SeedsService, WorkspaceDbSetupService],
})
export class SeedsModule {}
