import { GITConnectionType } from '@entities/organization_git_sync.entity';
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class BaseConfigDTO {
  @IsString()
  @IsNotEmpty()
  gitType: GITConnectionType;

  @IsUrl()
  @IsNotEmpty()
  gitUrl: string;
}

// GitHub SSH Config
export class GithubSshConfigDTO extends BaseConfigDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  branchName: string;

  @IsString()
  @IsOptional()
  sshPublicKey?: string;

  @IsString()
  @IsNotEmpty()
  sshPrivateKey?: string;
}

// GitHub HTTPS Config
export class GithubHttpsConfigDTO extends BaseConfigDTO {
  @IsString()
  @IsNotEmpty()
  branchName: string;

  @IsString()
  @IsNotEmpty()
  githubAppId: string;

  @IsString()
  @IsNotEmpty()
  githubAppInstallationId: string;

  @IsString()
  @IsNotEmpty()
  githubAppPrivateKey: string;

  @IsUrl()
  @IsOptional()
  githubEnterpriseUrl?: string;

  @IsUrl()
  @IsOptional()
  githubEnterpriseApiUrl?: string;
}
export class GitLabConfigDTO extends BaseConfigDTO {
  @IsString()
  @IsNotEmpty()
  branchName: string;

  @IsString()
  @IsNotEmpty()
  gitLabProjectId: string;

  @IsString()
  @IsNotEmpty()
  gitLabProjectAccessToken: string;

  @IsUrl()
  @IsOptional()
  gitLabEnterpriseUrl?: string;
}

export type ProviderConfigDTO = GithubSshConfigDTO | GithubHttpsConfigDTO | GitLabConfigDTO;
