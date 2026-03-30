import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class OrganizationGitCreateDto {
  @IsOptional()
  organizationId: string;

  @IsString()
  @IsNotEmpty()
  gitUrl: string;
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
}
