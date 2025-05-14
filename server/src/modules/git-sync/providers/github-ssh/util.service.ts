import { Injectable } from '@nestjs/common';
import { AppGitSync } from 'src/entities/app_git_sync.entity';
import { User } from 'src/entities/user.entity';
import * as NodeGit from '@figma/nodegit';
import { BaseGitUtilService } from '@modules/git-sync/base-git-util.service';

@Injectable()
export class SSHGitSyncUtilityService extends BaseGitUtilService {
  constructor() {
    super();
  }

  async createAppGit(CreateBody: any): Promise<AppGitSync> {
    throw new Error('Method not implemented.');
  }

  async pushRepo(repo: NodeGit.Repository, appGit: AppGitSync, branchName: string, remoteName: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async gitCommit(
    repo: NodeGit.Repository,
    commitMessage: string,
    commitingUser: User,
    appGit: AppGitSync
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async findAppGitByAppIdSSH(appId: string): Promise<AppGitSync> {
    throw new Error('Method not implemented.');
  }
}
