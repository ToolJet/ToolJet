import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OrganizationGitHttps } from '@entities/gitsync_entities/organization_git_https.entity';
import { GithubHttpsConfigDTO } from '../dto/provider-config.dto';
import { Octokit } from '@octokit/rest';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { AppGitSync } from '@entities/app_git_sync.entity';
import { User } from '@entities/user.entity';
import { BaseGitUtilService } from '@modules/git-sync/base-git-util.service';

@Injectable()
export class HTTPSGitSyncUtilityService extends BaseGitUtilService {
  constructor() {
    super();
  }

  async createGitHttpsConfig(
    configData: GithubHttpsConfigDTO,
    orgGitId: string,
    manager?: EntityManager
  ): Promise<OrganizationGitHttps> {
    throw new Error('Method not implemented.');
  }

  async testGitConnection(orgGitId: string, manager?: EntityManager): Promise<any> {
    throw new Error('Method not implemented.');
  }

  private validateGitHubEnterpriseUrls(enterpriseUrl: string, apiUrl: string): void {
    throw new Error('Method not implemented.');
  }

  private createOctokitInstance(
    jwt: string,
    githubEnterpriseApiUrl?: string,
    sslVerifyDisabled: boolean = false
  ): Octokit {
    throw new Error('Method not implemented.');
  }

  private async testBranchExistence(
    token: string,
    githubBranch: string,
    githubUrl: string,
    githubEnterpriseApiUrl: string
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private generateJWT(appId: string, privateKey: string): string {
    throw new Error('Method not implemented.');
  }

  async getInstallationToken(octokit: Octokit, installationId: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async gitCommit(repoPath: string, commitMessage: string, appGit: AppGitSync, commitingUser: User): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async gitPush(repoPath: string, orgGit: OrganizationGitSync, remoteName: string = 'origin'): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async findAppGitByAppIdHTTPS(appId: string): Promise<AppGitSync> {
    throw new Error('Method not implemented.');
  }
}
