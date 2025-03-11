/* eslint-disable no-prototype-builtins */
import { Injectable } from '@nestjs/common';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import {
  OrganizationGitCreateDto,
  OrganizationGitStatusUpdateDto,
  OrganizationGitUpdateDto,
} from '@dto/organization_git.dto';
import { IGitSyncService } from './Interfaces/IService';

@Injectable()
export class GitSyncService implements IGitSyncService {
  constructor() {}

  async deleteConfig(organizationId: string, organizationGit: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async createOrganizationGit(organizationGitCreateDto: OrganizationGitCreateDto): Promise<OrganizationGitSync> {
    throw new Error('Method not implemented.');
  }

  async updateOrgGit(organizationId: string, id: string, updateOrgGitDto: OrganizationGitUpdateDto): Promise<void> {
    throw new Error('Method not implemented.');
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

  async getOrganizationById(userOrganizationId: string, organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getOrgGitStatusById(userOrganizationId: string, organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
