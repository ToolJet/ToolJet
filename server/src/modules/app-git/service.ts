import { Injectable } from '@nestjs/common';
import { AppGitPullDto, AppGitPullUpdateDto, AppGitPushDto } from '@modules/app-git/dto';
import { User } from 'src/entities/user.entity';

@Injectable()
export class AppGitService {
  async checkSyncApp(user: User, versionId: string, organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async gitPushApp(appGitPushBody: AppGitPushDto, user: User, appGitId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async gitPullAppInfo(user: User, appId?: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async createGitApp(user: User, appMetaBody: AppGitPullDto): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async pullGitAppChanges(user: User, appMetaBody: AppGitPullUpdateDto, appId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
