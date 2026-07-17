import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { GITConnectionType } from '@entities/organization_git_sync.entity';
export class OrganizationGitCreateDto {
  @IsOptional()
  organizationId: string;

  @IsString()
  @IsOptional()
  gitUrl: string;

  @IsString()
  @IsNotEmpty()
  gitType: string;
}

export class OrganizationGitUpdateDto {
  @IsString()
  @IsOptional()
  gitUrl: string;

  @IsOptional()
  @IsBoolean()
  autoCommit: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['ed25519', 'rsa'])
  keyType: 'ed25519' | 'rsa';

  @IsOptional()
  @IsBoolean()
  branchingEnabled?: boolean;
}

export class OrganizationGitConfigUpdateDto {
  @IsOptional()
  @IsBoolean()
  autoCommit?: boolean;

  @IsOptional()
  @IsBoolean()
  branchingEnabled?: boolean;
}

export class OrganizationGitStatusUpdateDto {
  @IsOptional()
  @IsBoolean()
  isEnabled: boolean;

  @IsString()
  @IsNotEmpty()
  gitType: GITConnectionType;
}

// Payload for the dedicated PUT /git-sync/:id/is-branching-enabled endpoint that toggles
// only the workspace branching mode (organization_git_sync.is_branching_enabled).
export class UpdateBranchingEnabledDto {
  @IsBoolean()
  isBranchingEnabled: boolean;
}
