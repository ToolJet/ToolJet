/* eslint-disable no-prototype-builtins */
import { Injectable } from '@nestjs/common';
import {
  OrganizationGitCreateDto,
  OrganizationGitStatusUpdateDto,
  OrganizationGitUpdateDto,
} from '@dto/organization_git.dto';
import { IGitSyncService } from './Interfaces/IService';

@Injectable()
export class GitSyncService implements IGitSyncService {
  constructor() {}

  async deleteConfig(organizationId: string, organizationGit: string, gitType: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async createOrganizationGit(orgGitCreateDto: OrganizationGitCreateDto, userOrganizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async updateOrgGit(
    userOrganizationId: string,
    organizationId: string,
    updateOrgGitDto: OrganizationGitUpdateDto,
    gitType: string
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async updateOrgGitStatus(
    organizationId: string,
    id: string,
    updateOrgGitDto: OrganizationGitStatusUpdateDto
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async setFinalizeConfig(userId: string, organizationId: string, organizationGitId: string, gitType: string) {
    throw new Error('Method not implemented.');
  }

  async getOrganizationById(userOrganizationId: string, organizationId: string, gitType: string) {
    throw new Error('Method not implemented.');
  }

  async getOrgGitStatusById(userOrganizationId: string, organizationId: string) {
    throw new Error('Method not implemented.');
  }
}
