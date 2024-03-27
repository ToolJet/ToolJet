import { Injectable } from '@nestjs/common';
import { INSTANCE_SYSTEM_SETTINGS, INSTANCE_USER_SETTINGS } from 'src/helpers/instance_settings.constants';
import { InstanceSettingsService } from './instance_settings.service';

@Injectable()
export class InstanceLoginConfigsService {
  constructor(private instanceSettingsService: InstanceSettingsService) {}

  async validateAndUpdateSystemParams(params: any): Promise<void> {
    if (params[INSTANCE_SYSTEM_SETTINGS.ENABLE_SIGNUP] === true) {
      const isPersonalWorkspaceAllowedConfig = await this.instanceSettingsService.getSettings(
        INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE
      );

      if (isPersonalWorkspaceAllowedConfig !== 'true') {
        throw new Error('Personal workspace must be enabled for sign up to be enabled');
      }
    }
    await this.instanceSettingsService.updateSystemParams(params);
  }
}
