import { Controller, Get, Body, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { CopilotRequestDto, AddUpdateCopilitAPIKeyDto } from '@dto/copilot.dto';
import { CopilotService } from '@services/copilot.service';
import { OrgEnvironmentVariablesService } from '@services/org_environment_variables.service';
import { EncryptionService } from '@services/encryption.service';

@Controller('copilot')
export class CopilotController {
  constructor(
    private orgEnvironmentVariablesService: OrgEnvironmentVariablesService,
    private copilotService: CopilotService,
    private encryptionService: EncryptionService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async getRecomendations(@User() user, @Body() body: CopilotRequestDto) {
    const userId = user.id;

    const workspaceEnvs = await this.orgEnvironmentVariablesService.fetchVariables(user.organizationId);

    const copilotApiKeyId = workspaceEnvs.find((env) => env.variableName === 'copilot_api_key');

    const { value } = copilotApiKeyId
      ? await this.orgEnvironmentVariablesService.fetch(user.organizationId, copilotApiKeyId.id)
      : null;

    const decryptedAPIkey = value
      ? await await this.encryptionService.decryptColumnValue('org_environment_variables', user.organizationId, value)
      : null;
    console.log('----COPILOT ENV VARS ==>', decryptedAPIkey);

    return await this.copilotService.getCopilotRecommendations(body, userId, decryptedAPIkey);
  }

  @UseGuards(JwtAuthGuard)
  @Post('api-key')
  async addUpdateCopilotAPIKey(@User() user, @Body() body: AddUpdateCopilitAPIKeyDto) {
    const { key } = body;
    const userId = user.id;
    return await this.copilotService.addUpdateCopilotAPIKey(key, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('api-key')
  async getCopilotAPIKey(@User() user) {
    return await this.copilotService.getCopilotAPIKey(user.id);
  }
}
