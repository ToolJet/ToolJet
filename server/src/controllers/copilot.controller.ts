import { Controller, Body, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { CopilotRequestDto } from '@dto/copilot.dto';
import { CopilotService } from '@services/copilot.service';
import { OrgEnvironmentVariablesService } from '@services/org_environment_variables.service';

@Controller('copilot')
export class CopilotController {
  constructor(
    private orgEnvironmentVariablesService: OrgEnvironmentVariablesService,
    private copilotService: CopilotService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async getRecomendations(@User() user, @Body() body: CopilotRequestDto) {
    const userId = user.id;

    const workspaceEnvs = await this.orgEnvironmentVariablesService.fetchVariables(user.organizationId);

    const copilotApiKeyId = workspaceEnvs.find((env) => env.variableName.includes('copilot_api_key'));

    const { value } = copilotApiKeyId
      ? await this.orgEnvironmentVariablesService.fetch(user.organizationId, copilotApiKeyId.id)
      : null;

    return await this.copilotService.getCopilotRecommendations(body, userId, user.organizationId, value);
  }

  @UseGuards(JwtAuthGuard)
  @Post('api-key')
  async validateCopilotAPIKey(@User() user, @Body() body: { secretKey: string; organizationId: string }) {
    return await this.copilotService.validateCopilotAPIKey(body.organizationId, body.secretKey);
  }
}
