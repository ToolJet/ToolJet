import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import * as NodeGit from '@figma/nodegit';

export interface IGitSyncUtilService {
  initializeGitRepo(initPath: string, orgGit: OrganizationGitSync): Promise<NodeGit.Repository>;
  setSshKey(orgGit: Partial<OrganizationGitSync>, keyType: 'ed25519' | 'rsa'): Promise<any>;
  testGitConnection(orgGit: OrganizationGitSync, initPath: string): Promise<any>;
  gitClone(repoPath: string, orgGit: OrganizationGitSync, depth?: number): Promise<NodeGit.Repository>;
  deleteDir(dirPath: string): Promise<void>;
  findOrgGitByOrganizationId(organizationId: string): Promise<OrganizationGitSync>;
  findOrgGitById(orgGitId: string): Promise<OrganizationGitSync>;
}
