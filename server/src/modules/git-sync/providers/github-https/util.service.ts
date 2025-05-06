import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, Equal, Repository } from 'typeorm';
import { OrganizationGitHttps } from '@entities/gitsync_entities/organization_git_https.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { GithubHttpsConfigDTO } from '../dto/provider-config.dto';
import { InjectRepository } from '@nestjs/typeorm';
const jwt = require('jsonwebtoken');
import { Octokit } from '@octokit/rest';
import { GITHUB_CONFIG } from './constants/github-configs';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import * as path from 'path';
import * as fs from 'fs';
import simpleGit from 'simple-git'; //npm i
import { GitErrorMessages } from '../../constants/gitsync_error.constant';
import { AppGitSync } from '@entities/app_git_sync.entity';
import { User } from '@entities/user.entity';
import * as forge from 'node-forge';
import * as https from 'https';
import { BaseGitUtilService } from '@modules/git-sync/base-git-util.service';
const GITHUB_API_PATH = 'api/v3';

@Injectable()
export class HTTPSGitSyncUtilityService extends BaseGitUtilService {
  @InjectRepository(OrganizationGitHttps)
  private organizationGitHttpsRepository: Repository<OrganizationGitHttps>;
  async createGitHttpsConfig(
    configData: GithubHttpsConfigDTO,
    orgGitId: string,
    manager?: EntityManager
  ): Promise<OrganizationGitHttps> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const gitHttpsConfigs = manager.create(OrganizationGitHttps, {
        httpsUrl: configData.gitUrl,
        githubBranch: configData.branchName,
        githubAppId: configData.githubAppId,
        githubInstallationId: configData.githubAppInstallationId,
        githubPrivateKey: configData.githubAppPrivateKey,
        githubEnterpriseUrl: configData?.githubEnterpriseUrl || '',
        githubEnterpriseApiUrl: configData?.githubEnterpriseApiUrl || '',
        configId: orgGitId,
      });
      const result = await manager.save(gitHttpsConfigs);
      return result;
    }, manager);
  }

  async gitClone(repoPath: string, orgGit: OrganizationGitSync, depth = 1) {
    const httpsConfigs = await this.findHttpsConfigs(orgGit?.id);
    const GIT_SSL_VERIFY_DISABLED =
      (httpsConfigs?.githubEnterpriseUrl &&
        httpsConfigs?.githubEnterpriseApiUrl &&
        process.env.GIT_SSL_VERIFY_DISABLED === 'true') ||
      false;
    if (GIT_SSL_VERIFY_DISABLED) {
      return this.gitCloneWithSslDisabled(repoPath, httpsConfigs, depth);
    } else {
      return this.gitCloneWithSslEnabled(repoPath, httpsConfigs, depth);
    }
  }

  async gitCloneWithSslDisabled(repoPath: string, httpsConfigs: OrganizationGitHttps, depth = 1) {
    try {
      const git = simpleGit();
      if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
      }
      const {
        httpsUrl,
        githubBranch,
        githubAppId,
        githubInstallationId,
        githubPrivateKey,
        githubEnterpriseUrl,
        githubEnterpriseApiUrl,
      } = httpsConfigs;
      const jwt = this.generateJWT(githubAppId, githubPrivateKey);
      let token, repositoryHttpsUrl;
      if (githubEnterpriseUrl || githubEnterpriseApiUrl) {
        const githubEnterpriseOctokit = new Octokit({
          auth: jwt,
          baseUrl: githubEnterpriseApiUrl || `${githubEnterpriseUrl}${GITHUB_API_PATH}`,
          request: {
            agent: new https.Agent({ rejectUnauthorized: false }),
          },
        });
        token = await this.getInstallationToken(githubEnterpriseOctokit, githubInstallationId);
        const urlObj = new URL(httpsUrl);
        repositoryHttpsUrl = httpsUrl.replace(
          `https://${urlObj.host}`,
          `https://x-access-token:${token}@${urlObj.host}`
        );
      } else {
        const octokit = new Octokit({
          auth: jwt,
        });
        token = await this.getInstallationToken(octokit, githubInstallationId);
        repositoryHttpsUrl = httpsUrl.replace('https://', `https://x-access-token:${token}@`);
      }
      await git.addConfig('http.sslVerify', 'false', false, 'global');
      const cloneData = await git.clone(repositoryHttpsUrl, repoPath, [
        '--branch',
        githubBranch,
        '--single-branch',
        '--depth',
        depth.toString(),
        '-c',
        'http.sslVerify=false',
      ]);
      await git.addConfig('http.sslVerify', 'true', false, 'global');
      return {
        success: true,
        path: repoPath,
        branch: githubBranch,
        clone: cloneData,
      };
    } catch (error) {
      // need to add error handling here
      console.log('error', error);
      throw new Error(`Repository clone failed due to ${error.message}`);
    }
  }
  async gitCloneWithSslEnabled(repoPath: string, httpsConfigs: OrganizationGitHttps, depth = 1) {
    try {
      const git = simpleGit();
      if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
      }
      const {
        httpsUrl,
        githubBranch,
        githubAppId,
        githubInstallationId,
        githubPrivateKey,
        githubEnterpriseUrl,
        githubEnterpriseApiUrl,
      } = httpsConfigs;
      const jwt = this.generateJWT(githubAppId, githubPrivateKey);
      let token, repositoryHttpsUrl;
      if (githubEnterpriseUrl || githubEnterpriseApiUrl) {
        const githubEnterpriseOctokit = new Octokit({
          auth: jwt,
          baseUrl: githubEnterpriseApiUrl || `${githubEnterpriseUrl}${GITHUB_API_PATH}`,
        });
        token = await this.getInstallationToken(githubEnterpriseOctokit, githubInstallationId);
        const urlObj = new URL(httpsUrl);
        repositoryHttpsUrl = httpsUrl.replace(
          `https://${urlObj.host}`,
          `https://x-access-token:${token}@${urlObj.host}`
        );
      } else {
        const octokit = new Octokit({
          auth: jwt,
        });
        token = await this.getInstallationToken(octokit, githubInstallationId);
        repositoryHttpsUrl = httpsUrl.replace('https://', `https://x-access-token:${token}@`);
      }
      const cloneData = await git.clone(repositoryHttpsUrl, repoPath, [
        '--branch',
        githubBranch,
        '--single-branch',
        '--depth',
        depth.toString(),
      ]);
      return {
        success: true,
        path: repoPath,
        branch: githubBranch,
        clone: cloneData,
      };
    } catch (error) {
      // need to add error handling here
      console.log('error', error);
      throw new Error(`Repository clone failed due to ${error.message}`);
    }
  }

  async findHttpsConfigs(orgGitId: string, manager?: EntityManager): Promise<OrganizationGitHttps> {
    if (manager) {
      return await manager.findOne(OrganizationGitHttps, {
        where: {
          configId: Equal(orgGitId),
        },
      });
    }
    return await this.organizationGitHttpsRepository.findOne({
      where: {
        configId: Equal(orgGitId),
      },
    });
  }
  async testGitConnection(orgGitId: string, manager?: EntityManager) {
    const GIT_SSL_VERIFY_DISABLED = process.env.GIT_SSL_VERIFY_DISABLED === 'true' || false;
    const httpsConfigs = await this.findHttpsConfigs(orgGitId, manager);
    const {
      httpsUrl,
      githubBranch,
      githubAppId,
      githubInstallationId,
      githubPrivateKey,
      githubEnterpriseUrl,
      githubEnterpriseApiUrl,
    } = httpsConfigs;

    try {
      if ((githubEnterpriseUrl && !githubEnterpriseApiUrl) || (!githubEnterpriseUrl && githubEnterpriseApiUrl)) {
        throw new Error(
          'Both Github Enterprise URL and Github Enterprise API URL must be provided when using Github Enterprise.'
        );
      }
      if (githubEnterpriseUrl && githubEnterpriseApiUrl) {
        this.validateGitHubEnterpriseUrls(githubEnterpriseUrl, githubEnterpriseApiUrl);
      }
      const jwt = this.generateJWT(githubAppId, githubPrivateKey);
      const octokit = this.createOctokitInstance(jwt, githubEnterpriseApiUrl, GIT_SSL_VERIFY_DISABLED);
      const appResponse = await octokit.request('GET /app', {
        headers: {
          'X-GitHub-Api-Version': GITHUB_CONFIG.API_VERSION,
        },
      });
      const installationResponse = await octokit.request('GET /app/installations/{installation_id}', {
        installation_id: parseInt(githubInstallationId),
        headers: {
          'X-GitHub-Api-Version': GITHUB_CONFIG.API_VERSION,
        },
      });
      const token = await this.getInstallationToken(octokit, githubInstallationId);
      await this.testBranchExistence(token, githubBranch, httpsUrl, githubEnterpriseApiUrl);
      return {
        success: true,
        appInfo: appResponse.data,
        installationInfo: installationResponse.data,
        connectionStatus: true,
        connectionMessage: 'Successfully Connected',
        errCode: 0,
      };
    } catch (err) {
      // add all error messages to constants  file
      let errorMessage = 'Please confirm the Github configurations \nand try again !';
      if (
        err.message &&
        (err.message.includes('secretOrPrivateKey') ||
          err.message.includes('private key') ||
          err.message.includes('PEM') ||
          err.message.includes('RS256'))
      ) {
        errorMessage = GitErrorMessages.INVALID_PRIVATE_KEY;
      } else if (err.message.includes('Github URL')) {
        errorMessage = err.message;
      } else if (err.message.includes('Branch not found')) {
        errorMessage = GitErrorMessages.INVALID_BRANCH_NAME;
      } else if (err.message.includes('point to the same server')) {
        errorMessage = GitErrorMessages.GITHUB_ENTERPRISE_INVALID_URL_FORMAT;
      }
      return {
        connectionStatus: false,
        connectionMessage: errorMessage,
        errCode: -20,
      };
    }
  }
  private validateGitHubEnterpriseUrls(enterpriseUrl: string, apiUrl: string): void {
    const enterpriseUrlObj = new URL(enterpriseUrl);
    const apiUrlObj = new URL(apiUrl);
    const enterpriseOrigin = enterpriseUrlObj.origin.toLowerCase();
    const apiOrigin = apiUrlObj.origin.toLowerCase();
    if (enterpriseOrigin !== apiOrigin) {
      throw new Error(
        `Github Enterprise URL and API URL must point to the same server (${enterpriseOrigin} vs ${apiOrigin})`
      );
    }
  }
  private createOctokitInstance(
    jwt: string,
    githubEnterpriseApiUrl?: string,
    sslVerifyDisabled: boolean = false
  ): Octokit {
    const octokitOptions: {
      auth: string;
      baseUrl?: string;
      request?: {
        agent?: https.Agent;
      };
    } = {
      auth: jwt,
    };
    // Configure baseUrl for GitHub Enterprise
    if (githubEnterpriseApiUrl) {
      octokitOptions.baseUrl = githubEnterpriseApiUrl;
    }

    // Disable SSL verification if needed for enterprise GitHub
    if (sslVerifyDisabled && githubEnterpriseApiUrl) {
      octokitOptions.request = {
        agent: new https.Agent({ rejectUnauthorized: false }),
      };
    }

    return new Octokit(octokitOptions);
  }
  private async testBranchExistence(
    token: string,
    githubBranch: string,
    githubUrl: string,
    githubEnterpriseApiUrl: string
  ) {
    const octokitOptions: {
      auth: string;
      baseUrl?: string;
      request?: {
        agent?: https.Agent;
      };
    } = {
      auth: token,
    };
    octokitOptions.baseUrl = githubEnterpriseApiUrl;
    const GIT_SSL_VERIFY_DISABLED = (githubEnterpriseApiUrl && process.env.GIT_SSL_VERIFY_DISABLED === 'true') || false;
    // Add SSL verification disable option only when needed
    if (GIT_SSL_VERIFY_DISABLED && githubEnterpriseApiUrl) {
      octokitOptions.request = {
        agent: new https.Agent({ rejectUnauthorized: false }),
      };
    }
    const octokit = new Octokit(octokitOptions);
    const regex = /https:\/\/(?:[^/]+)\/([^/]+)\/([^/]+)(?:\.git)?/;
    const match = githubUrl.match(regex);
    let owner, repo;
    if (match) {
      owner = match[1];
      repo = match[2];
      if (repo.endsWith('.git')) {
        repo = repo.slice(0, -4);
      }
    } else {
      throw new BadRequestException('Please check the Github URL and try again!');
    }
    await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
      owner,
      repo,
      branch: githubBranch,
      headers: {
        'X-GitHub-Api-Version': GITHUB_CONFIG.API_VERSION,
      },
    });
  }
  private generateJWT(appId: string, privateKey: string) {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now,
      exp: now + 10 * 60, // JWT expires in 10 minutes
      iss: appId,
    };
    const parsedKey = forge.pki.privateKeyFromPem(privateKey);
    const formattedKey = forge.pki.privateKeyToPem(parsedKey);
    return jwt.sign(payload, formattedKey, { algorithm: 'RS256' });
  }
  async getInstallationToken(octokit: Octokit, installationId: string) {
    try {
      const response = await octokit.request('POST /app/installations/{installation_id}/access_tokens', {
        installation_id: parseInt(installationId),
        headers: {
          'X-GitHub-Api-Version': GITHUB_CONFIG.API_VERSION,
        },
      });
      return response.data.token;
    } catch (error) {
      console.error('Error getting installation token:', error.message);
      throw error;
    }
  }

  async gitCommit(repoPath: string, commitMessage: string, appGit: AppGitSync, commitingUser: User) {
    const git = simpleGit(repoPath);
    try {
      // Checks if the path is a valid git repository
      if (!fs.existsSync(repoPath)) {
        throw new Error(`Repository path does not exist: ${repoPath}`);
      }
      if (!fs.existsSync(path.join(repoPath, '.git'))) {
        throw new Error(`Not a valid Git repository: ${repoPath}`);
      }
      await simpleGit(repoPath).addConfig('user.name', commitingUser?.firstName);
      await simpleGit(repoPath).addConfig('user.email', commitingUser?.email);
      await git.status();
      await git.add('.');
      const commitResult = await git.commit(commitMessage);
      appGit.lastCommitId = commitResult.commit;
      appGit.lastCommitMessage = commitMessage;
      appGit.lastCommitUser = `${commitingUser.firstName ? commitingUser.firstName : ''} ${
        commitingUser.lastName ? commitingUser.lastName : ''
      }`;
    } catch (error) {
      // Fallback: If the commit operation fails, try one more time as a safety measure.
      await git.add('.');
      await git
        .commit(commitMessage)
        .then((commitResult) => {
          appGit.lastCommitId = commitResult.commit;
          appGit.lastCommitMessage = commitMessage;
          appGit.lastCommitUser = `${commitingUser.firstName ? commitingUser.firstName : ''} ${
            commitingUser.lastName ? commitingUser.lastName : ''
          }`;
        })
        .catch((error) => {
          throw new Error(`Git commit failed after retry: ${error.message}`);
        });
    }
  }
  async gitPush(repoPath: string, orgGit: OrganizationGitSync, remoteName: string = 'origin') {
    try {
      const git = simpleGit(repoPath);
      const httpsConfigs = await this.findHttpsConfigs(orgGit?.id);
      const GIT_SSL_VERIFY_DISABLED =
        (httpsConfigs?.githubEnterpriseUrl &&
          httpsConfigs?.githubEnterpriseApiUrl &&
          process.env.GIT_SSL_VERIFY_DISABLED === 'true') ||
        false;
      if (GIT_SSL_VERIFY_DISABLED) {
        await git.addConfig('http.sslVerify', 'false', false, 'global');
      }
      const {
        httpsUrl,
        githubBranch,
        githubAppId,
        githubInstallationId,
        githubPrivateKey,
        githubEnterpriseUrl,
        githubEnterpriseApiUrl,
      } = httpsConfigs;
      // Generate JWT for GitHub App
      const jwt = this.generateJWT(githubAppId, githubPrivateKey);
      let token, authRemoteUrl;
      if (githubEnterpriseUrl || githubEnterpriseApiUrl) {
        // GitHub Enterprise Server flow
        const octokitOptions: {
          auth: string;
          baseUrl?: string;
          request?: {
            agent?: https.Agent;
          };
        } = {
          auth: jwt,
          baseUrl: githubEnterpriseApiUrl || `${githubEnterpriseUrl}${GITHUB_API_PATH}`,
        };
        if (GIT_SSL_VERIFY_DISABLED) {
          octokitOptions.request = {
            agent: new https.Agent({ rejectUnauthorized: false }),
          };
        }
        const enterpriseOctokit = new Octokit(octokitOptions);
        token = await this.getInstallationToken(enterpriseOctokit, githubInstallationId);
        const urlObj = new URL(httpsUrl);
        authRemoteUrl = httpsUrl.replace(`https://${urlObj.host}`, `https://x-access-token:${token}@${urlObj.host}`);
      } else {
        const githubOctokit = new Octokit({
          auth: jwt,
        });
        token = await this.getInstallationToken(githubOctokit, githubInstallationId);
        authRemoteUrl = httpsUrl.replace('https://', `https://x-access-token:${token}@`);
      }
      await git.remote(['set-url', remoteName, authRemoteUrl]);
      const pushResult = await git.push(remoteName, githubBranch);
      await git.remote(['set-url', remoteName, httpsUrl]);
      if (GIT_SSL_VERIFY_DISABLED) {
        await git.addConfig('http.sslVerify', 'true', false, 'global');
      }
      return pushResult;
    } catch (err) {
      // need to work more on error handling
      console.log('error', err);
      throw err;
    }
  }
  async findAppGitByAppIdHTTPS(appId: string): Promise<AppGitSync> {
    return this.appGitRepository.findOne({
      where: { appId: appId },
      relations: ['orgGit', 'orgGit.gitHttps'],
    });
  }
}
// For Enteprise URL Setup
// Octokit : change the base url to have         octokitOptions.baseUrl = `${githubEnterpriseUrl}/api/v3`;
// SImple git : change the https base url from  httpsUrl to your self-hosted GitHub Enterprise instance (e.g., https://github.company.com) instead of https://github.com
