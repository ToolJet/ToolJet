import { Injectable, NotImplementedException } from '@nestjs/common';
import {
  OrganizationGitCreateDto,
  OrganizationGitStatusUpdateDto,
  OrganizationGitUpdateDto,
} from '@dto/organization_git.dto';
import { IGitSyncConfigsService } from './Interfaces/IService';

// CE stub. Real implementation lives in ee/git-sync-configs/service.ts.
@Injectable()
export class GitSyncConfigsService implements IGitSyncConfigsService {
  constructor() {}

  async getOrgGitByOrgId(_userOrganizationId: string, _organizationId: string, _gitType?: string): Promise<any> {
    throw new NotImplementedException();
  }

  async getOrgGitStatusById(_userOrganizationId: string, _organizationId: string): Promise<any> {
    throw new NotImplementedException();
  }

  async createOrganizationGit(_dto: OrganizationGitCreateDto, _userOrganizationId: string): Promise<any> {
    throw new NotImplementedException();
  }

  async updateOrgGit(
    _userOrganizationId: string,
    _organizationGitId: string,
    _updateOrgGitDto: OrganizationGitUpdateDto,
    _gitType: string
  ): Promise<void> {
    throw new NotImplementedException();
  }

  async updateOrgGitStatus(
    _organizationId: string,
    _organizationGitId: string,
    _updateOrgGitDto: OrganizationGitStatusUpdateDto
  ): Promise<void> {
    throw new NotImplementedException();
  }

  async deleteConfig(_organizationId: string, _organizationGitId: string, _gitType: string): Promise<void> {
    throw new NotImplementedException();
  }
}
