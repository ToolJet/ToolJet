import { BaseGitUtilService } from '@modules/git-sync/base-git-util.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SSHGitSyncUtilityService extends BaseGitUtilService {}
