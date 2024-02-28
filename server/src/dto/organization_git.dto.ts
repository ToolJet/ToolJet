import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class OrganizationGitCreateDto {
  @IsString()
  @IsNotEmpty()
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
  @IsString()
  sshPrivateKey: string;

  @IsOptional()
  @IsString()
  sshPublicKey: string;

  @IsOptional()
  @IsBoolean()
  isFinalized: boolean;

  @IsOptional()
  @IsBoolean()
  isEnabled: boolean;

  @IsOptional()
  @IsBoolean()
  autoCommit: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['ed25519', 'rsa'])
  keyType: 'ed25519' | 'rsa';
}
