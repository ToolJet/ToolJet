import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { GITConnectionType } from '@entities/organization_git_sync.entity';
export class OrganizationGitCreateDto {
  @IsOptional()
  organizationId: string;

  @IsString()
  @IsNotEmpty()
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
}

export class OrganizationGitStatusUpdateDto {
  @IsOptional()
  @IsBoolean()
  isEnabled: boolean;

  @IsString()
  @IsNotEmpty()
  gitType: GITConnectionType;
}
