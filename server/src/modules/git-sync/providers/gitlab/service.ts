import { BaseGitSyncService } from '@modules/git-sync/base-git.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GitLabGitSyncService extends BaseGitSyncService {}
