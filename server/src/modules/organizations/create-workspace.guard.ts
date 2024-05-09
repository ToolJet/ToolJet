import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { InstanceSettingsService } from '@services/instance_settings.service';
import { Observable } from 'rxjs';
import { isSuperAdmin } from 'src/helpers/utils.helper';
import { INSTANCE_USER_SETTINGS } from 'src/helpers/instance_settings.constants';

@Injectable()
export class CreateWorkspaceGuard implements CanActivate {
  constructor(private instanceSettingsService: InstanceSettingsService) {}

  async allowedPersonalWorkspace(request: any): Promise<boolean> {
    const user = request.user;
    const isPersonalWorkspaceEnabled =
      (await this.instanceSettingsService.getSettings(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE)) === 'true';
    return isSuperAdmin(user) || isPersonalWorkspaceEnabled;
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.allowedPersonalWorkspace(request);
  }
}
