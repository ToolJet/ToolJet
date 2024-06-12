import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { InstanceSettingsService } from '@services/instance_settings.service';
import { INSTANCE_SYSTEM_SETTINGS } from 'src/helpers/instance_settings.constants';

@Injectable()
export class SignupDisableGuard implements CanActivate {
  constructor(private instanceSettingsService: InstanceSettingsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const enableSignUp = await this.instanceSettingsService.getSettings(INSTANCE_SYSTEM_SETTINGS.ENABLE_SIGNUP);
    return request.body.organizationId || enableSignUp;
  }
}
