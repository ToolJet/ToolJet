import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';

// SSH provider configuration
export class OrganizationGitSshConfigDto extends OrganizationGitSync {
  @IsString()
  @IsNotEmpty()
  sshPublicKey: string;

  @IsString()
  @IsOptional()
  sshPrivateKey: string;

  @IsString()
  @IsNotEmpty()
  gitUrl: string;

  @IsString()
  keyType: string;

  @IsBoolean()
  isFinalized: boolean;

  @IsBoolean()
  @IsNotEmpty()
  hasProviderConfigs: boolean;
}

// HTTPS provider configuration -> pending
export class OrganizationGitHttpsConfigDto extends OrganizationGitSync {
  @IsString()
  @IsNotEmpty()
  httpsUrl: string;

  @IsString()
  @IsNotEmpty()
  gitUrl: string;

  @IsString()
  @IsNotEmpty()
  githubBranch: string;

  @IsString()
  @IsNotEmpty()
  githubAppId: string;

  @IsString()
  @IsNotEmpty()
  githubInstallationId: string;

  @IsString()
  @IsNotEmpty()
  githubPrivateKey: string;

  @IsString()
  @IsOptional()
  githubEnterpriseUrl: string;

  @IsString()
  @IsOptional()
  githubEnterpriseApiUrl: string;

  @IsBoolean()
  isFinalized: boolean;

  @IsBoolean()
  @IsNotEmpty()
  hasProviderConfigs: boolean;
}
export class OrganizationGitLabConfigDto extends OrganizationGitSync {
  @IsString()
  @IsNotEmpty()
  gitLabUrl: string;

  @IsString()
  @IsNotEmpty()
  gitlabBranch: string;

  @IsString()
  @IsNotEmpty()
  gitlabProjectId: string;

  @IsString()
  @IsNotEmpty()
  gitlabProjectAccessToken: string;

  @IsString()
  @IsOptional()
  gitlabEnterpriseUrl: string;

  @IsBoolean()
  isFinalized: boolean;

  @IsBoolean()
  @IsNotEmpty()
  hasProviderConfigs: boolean;
}