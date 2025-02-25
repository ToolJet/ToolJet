import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { isSuperAdmin } from 'src/helpers/utils.helper';
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';

@Injectable()
export class AllowPersonalWorkspaceGuard implements CanActivate {
  constructor(protected readonly instanceSettingsUtilService: InstanceSettingsUtilService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const isPersonalWorkspaceEnabled =
      (await this.instanceSettingsUtilService.getSettings(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE)) === 'true';

    return isSuperAdmin(user) || isPersonalWorkspaceEnabled;
  }
}
