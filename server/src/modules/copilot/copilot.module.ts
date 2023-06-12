import { Module } from '@nestjs/common';
import { CopilotController } from '@controllers/copilot.controller';
import { CopilotService } from '@services/copilot.service';
import { OrgEnvironmentVariablesService } from '@services/org_environment_variables.service';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { EncryptionService } from '@services/encryption.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [CopilotController],
  imports: [TypeOrmModule.forFeature([OrgEnvironmentVariable])],
  providers: [CopilotService, OrgEnvironmentVariablesService, EncryptionService],
})
export class CopilotModule {}
