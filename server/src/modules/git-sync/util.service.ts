/* eslint-disable no-prototype-builtins */
import { Injectable } from '@nestjs/common';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { IGitSyncUtilService } from './Interfaces/IUtilService';
import { OrganizationGitSsh } from '@entities/gitsync_entities/organization_git_ssh.entity';
import { EntityManager } from 'typeorm';
import { OrganizationGitHttps } from '@entities/gitsync_entities/organization_git_https.entity';
import { Octokit } from '@octokit/rest';

@Injectable()
export class GitSyncUtilService implements IGitSyncUtilService {
  constructor() {}

  async findSSHConfigs(orgGitId: string, manager?: EntityManager): Promise<OrganizationGitSsh> {
    throw new Error('Method not implemented.');
  }

  async initializeGitRepo(initPath: string, orgGit: OrganizationGitSync): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getInstallationToken(octokit: Octokit, installationId: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async setSshKey(orgGitSsh: Partial<OrganizationGitSsh>, keyType: 'ed25519' | 'rsa' = 'ed25519'): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async testGitConnection(
    orgGit: OrganizationGitSync,
    initPath: string
  ): Promise<{
    connectionStatus: boolean;
    connectionMessage: string;
    errCode: number;
  }> {
    throw new Error('Method not implemented.');
  }

  async gitClone(repoPath: string, orgGit: OrganizationGitSync, depth = 1): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async gitCloneWithSslDisabled(
    repoPath: string,
    httpsConfigs: OrganizationGitHttps,
    depth = 1
  ): Promise<{
    success: boolean;
    path: string;
    branch: string;
    clone: any;
  }> {
    throw new Error('Method not implemented.');
  }

  async gitCloneWithSslEnabled(
    repoPath: string,
    httpsConfigs: OrganizationGitHttps,
    depth = 1
  ): Promise<{
    success: boolean;
    path: string;
    branch: string;
    clone: any;
  }> {
    throw new Error('Method not implemented.');
  }

  async findHttpsConfigs(orgGitId: string, manager?: EntityManager): Promise<OrganizationGitHttps> {
    throw new Error('Method not implemented.');
  }

  async findOrgGitById(orgGitId: string): Promise<OrganizationGitSync> {
    throw new Error('Method not implemented.');
  }

  async deleteDir(dirPath: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async findOrgGitByOrganizationId(organizationId: string): Promise<OrganizationGitSync> {
    throw new Error('Method not implemented.');
  }

  async gitSSHClone(repoPath: string, orgGit: OrganizationGitSync, depth = 1): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
