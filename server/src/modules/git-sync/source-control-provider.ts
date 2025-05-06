import { Injectable } from '@nestjs/common';
import { AppVersion } from '@entities/app_version.entity';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { GITConnectionType } from '@entities/organization_git_sync.entity';
import { SSHGitSyncService } from '@modules/git-sync/providers/github-ssh/service';
import { HTTPSGitSyncService } from './providers/github-https/service';
@Injectable()
export class SourceControlProviderService {
  constructor(
    @InjectRepository(OrganizationGitSync)
    private organizationGitRepository: Repository<OrganizationGitSync>,
    @InjectRepository(AppVersion)
    private appVersionsRepository: Repository<AppVersion>,
    private sshGitHubService: SSHGitSyncService,
    private httpsGitHubService: HTTPSGitSyncService
  ) {}

  async getSourceControlService(organizationId: string, gitType?: string) {
    const data = await this.organizationGitRepository.findOne({
      where: { organizationId: Equal(organizationId) },
      order: undefined,
    });
    if ((!data && gitType) || (data && gitType)) {
      switch (gitType) {
        case GITConnectionType.GITHUB_SSH:
          return this.sshGitHubService;
        case GITConnectionType.GITHUB_HTTPS:
          return this.httpsGitHubService;
        default:
          return null;
      }
    } else if (!data && !gitType) {
      return this.sshGitHubService;
    }
    const sourceControlType: GITConnectionType =
      GITConnectionType[data.gitType.toUpperCase() as keyof typeof GITConnectionType];

    switch (sourceControlType) {
      case GITConnectionType.GITHUB_SSH:
        return this.sshGitHubService;
      case GITConnectionType.GITHUB_HTTPS:
        return this.httpsGitHubService;
      default:
        return null;
    }
  }
}
