import { Injectable } from '@nestjs/common';
import * as NodeGit from '@figma/nodegit';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { IGitSyncUtilService } from './Interfaces/IUtilService';

@Injectable()
export class GitSyncUtilService implements IGitSyncUtilService {
  // Initialize Git repository
  async initializeGitRepo(initPath: string, orgGit: OrganizationGitSync): Promise<NodeGit.Repository> {
    throw new Error('Method not implemented.');
  }

  // Set SSH key for organization Git
  async setSshKey(orgGit: Partial<OrganizationGitSync>, keyType: 'ed25519' | 'rsa' = 'ed25519'): Promise<any> {
    throw new Error('Method not implemented.');
  }

  // Test Git connection
  async testGitConnection(orgGit: OrganizationGitSync, initPath: string) {
    throw new Error('Method not implemented.');
  }

  // Clone Git repository
  async gitClone(repoPath: string, orgGit: OrganizationGitSync, depth = 1) {
    throw new Error('Method not implemented.');
  }

  // Delete directory
  async deleteDir(dirPath: string) {
    throw new Error('Method not implemented.');
  }

  async findOrgGitByOrganizationId(organizationId: string): Promise<OrganizationGitSync> {
    throw new Error('Method not implemented.');
  }

  async findOrgGitById(orgGitId: string): Promise<OrganizationGitSync> {
    throw new Error('Method not implemented.');
  }
}
