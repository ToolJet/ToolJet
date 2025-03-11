import { INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class SignupDisableGuard implements CanActivate {
  constructor(protected readonly instanceSettingsUtilService: InstanceSettingsUtilService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const enableSignUp = await this.instanceSettingsUtilService.getSettings(INSTANCE_SYSTEM_SETTINGS.ENABLE_SIGNUP);
    return request.body.organizationId || enableSignUp;
  }
}
