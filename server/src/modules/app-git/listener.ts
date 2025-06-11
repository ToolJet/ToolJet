import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { App } from '@entities/app.entity';
import { AppUpdateDto } from '@modules/apps/dto';
import { User } from '@entities/user.entity';
import { AppVersion } from '@entities/app_version.entity';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';

@Injectable()
export class AppVersionRenameListener {
  @OnEvent('app-rename-commit')
  async handleAppRenameCommit(args: { user: User; organizationId: string; app: App; appUpdateDto: AppUpdateDto }) {}
  @OnEvent('version-rename-commit')
  async handleVersionRenameCommit(args: {
    user: User;
    appId: string;
    organizationId: string;
    appVersion: AppVersion;
    appVersionUpdateDto: AppVersionUpdateDto;
  }) {}
}
