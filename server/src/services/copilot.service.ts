import { Injectable } from '@nestjs/common';
import { CopilotRequestDto } from '@dto/copilot.dto';
import { EncryptionService } from '@services/encryption.service';
import got from 'got';

type ICopilotOptions = CopilotRequestDto;

@Injectable()
export class CopilotService {
  constructor(private encryptionService: EncryptionService) {}
  async getCopilotRecommendations(
    copilotOptions: ICopilotOptions,
    userId: string,
    orgnaizationId: string,
    encryptedAPIKey: string
  ) {
    const { query, context, language } = copilotOptions;

    const decryptedAPIkey = await this.encryptionService.decryptColumnValue(
      'org_environment_variables',
      orgnaizationId,
      encryptedAPIKey
    );

    const response = await got(`${process.env.COPILOT_API_ENDPOINT}/copilot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': decryptedAPIkey,
      },
      body: JSON.stringify({
        query: query,
        context: context,
        language: language,
        workspaceId: orgnaizationId,
      }),
    });

    return {
      data: JSON.parse(response.body),
      status: response.statusCode,
    };
  }

  async validateCopilotAPIKey(workspaceId: string, secretKey: string, adminEmailId: string) {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workspaceId: workspaceId, action: 'get', apiKey: secretKey, admin: adminEmailId }),
    };

    const response = await fetch(`${process.env.COPILOT_API_ENDPOINT}/api-key`, options);
    const { isValid } = await response.json();

    return {
      statusCode: response.status,
      status: isValid ? 'ok' : 'invalid',
    };
  }
}
