import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { InstanceSettingsService } from '@services/instance_settings.service';
import { UsersService } from '@services/users.service';
import { Observable } from 'rxjs';
import { User } from 'src/entities/user.entity';
import { isSuperAdmin } from 'src/helpers/utils.helper';
import { INSTANCE_USER_SETTINGS } from 'src/helpers/instance_settings.constants';

@Injectable()
export class AllowPersonalWorkspaceGuard implements CanActivate {
  constructor(private instanceSettingsService: InstanceSettingsService, private usersService: UsersService) {}

  async allowedPersonalWorkspace(user: User): Promise<boolean> {
    return (
      isSuperAdmin(user) ||
      (await this.instanceSettingsService.getSettings(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE)) === 'true'
    );
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.allowedPersonalWorkspace(request.user);
  }
}
