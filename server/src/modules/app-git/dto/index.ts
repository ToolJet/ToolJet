import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class AppGitCreateDto {
  @IsString()
  @IsNotEmpty()
  appId: string;

  @IsString()
  @IsNotEmpty()
  versionId: string;

  @IsString()
  @IsNotEmpty()
  organizationGitId: string;

  @IsString()
  @IsNotEmpty()
  gitAppName: string;
}

export class AppGitPushDto {
  @IsString()
  gitAppName: string;

  @IsString()
  versionId: string;

  @IsString()
  lastCommitMessage: string;

  @IsString()
  gitVersionName: string;
}

export class AppGitPullDto {
  @IsString()
  gitAppId: string;

  @IsOptional()
  @IsString()
  gitVersionId?: string;

  @IsOptional()
  @IsString()
  lastCommitMessage?: string;

  @IsOptional()
  @IsString()
  lastCommitUser?: string;

  @IsOptional()
  @IsString()
  lastPushDate?: string;

  @IsString()
  organizationGitId: string;

  @IsString()
  gitAppName: string;

  @IsOptional()
  @IsString()
  gitVersionName?: string;
}
export class AppGitPullUpdateDto {
  @IsString()
  gitVersionId: string;

  @IsString()
  @IsOptional()
  lastCommitMessage?: string;

  @IsString()
  @IsOptional()
  lastCommitUser?: string;

  @IsString()
  @IsOptional()
  lastPushDate?: string;

  @IsString()
  gitAppName: string;

  @IsString()
  @IsOptional()
  gitVersionName?: string;
}
export class AppGitUpdateDto {
  @IsBoolean()
  allowEditing: boolean;
}
export class RenameAppOrVersionDto {
  @IsString()
  @IsNotEmpty()
  prevName: string;

  @IsString()
  @IsNotEmpty()
  updatedName: string;

  @IsBoolean()
  @IsOptional()
  renameVersionFlag: boolean;

  @IsString()
  @IsOptional()
  remoteName: string;
}
