/* eslint-disable no-prototype-builtins */
import { Injectable } from '@nestjs/common';
import {
  OrganizationGitCreateDto,
  OrganizationGitStatusUpdateDto,
  OrganizationGitUpdateDto,
} from '@dto/organization_git.dto';
import { IGitSyncService } from './Interfaces/IService';
import { SSHGitSyncService } from './providers/github-ssh/service';
import { HTTPSGitSyncService } from './providers/github-https/service';
import { SourceControlProviderService } from './source-control-provider';
import { decamelizeKeys } from 'humps';

@Injectable()
export class GitSyncService implements IGitSyncService {
  private sourceControlStrategy: SSHGitSyncService | HTTPSGitSyncService;
  constructor(private sourceControlProviderService: SourceControlProviderService) {}

  async deleteConfig(organizationId: string, organizationGit: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async createOrganizationGit(orgGitCreateDto: OrganizationGitCreateDto, userOrganizationId: string): Promise<any> {
    orgGitCreateDto.organizationId = userOrganizationId;
    this.sourceControlStrategy = await this.sourceControlProviderService.getSourceControlService(
      null,
      orgGitCreateDto?.gitType
    );
    const orgGit = await this.sourceControlStrategy.createOrganizationGit(orgGitCreateDto);
    return decamelizeKeys({ orgGit });
  }

  async updateOrgGit(
    userOrganizationId: string,
    organizationId: string,
    updateOrgGitDto: OrganizationGitUpdateDto,
    gitType: string
  ): Promise<void> {
    this.sourceControlStrategy = await this.sourceControlProviderService.getSourceControlService(
      userOrganizationId,
      gitType
    );
    await this.sourceControlStrategy.updateOrgGit(userOrganizationId, organizationId, updateOrgGitDto);
    return;
  }

  async updateOrgGitStatus(
    organizationId: string,
    id: string,
    updateOrgGitDto: OrganizationGitStatusUpdateDto
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async setFinalizeConfig(userId: string, organizationId: string, organizationGitId: string) {
    throw new Error('Method not implemented.');
  }

  async getOrganizationById(userOrganizationId: string, organizationId: string, gitType: string) {
    this.sourceControlStrategy = await this.sourceControlProviderService.getSourceControlService(null, gitType);
    const data = await this.sourceControlStrategy.getProviderConfigs(userOrganizationId, organizationId);
    return {
      organization_git: decamelizeKeys(data),
    };
  }

  async getOrgGitStatusById(userOrganizationId: string, organizationId: string) {
    this.sourceControlStrategy = await this.sourceControlProviderService.getSourceControlService(userOrganizationId);
    return await this.sourceControlStrategy.getOrgGitStatusById(userOrganizationId, organizationId);
  }
}
