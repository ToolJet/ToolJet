import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class AppGitPushDto {
  @IsString()
  gitAppName: string;

  @IsString()
  versionId: string;

  @IsString()
  lastCommitMessage: string;

  @IsString()
  gitVersionName: string;

  @IsString()
  @IsOptional()
  gitBranchName?: string;

  @IsBoolean()
  @IsOptional()
  allowMasterPush?: boolean;
}

export class AppGitPullDto {
  @IsString()
  @IsOptional()
  gitAppId?: string;

  @IsString()
  @IsOptional()
  appCoRelationId?: string;

  @IsString()
  @IsOptional()
  gitAppName?: string;

  @IsString()
  @IsOptional()
  gitVersionName?: string;

  @IsString()
  @IsOptional()
  appName?: string;

  @IsString()
  @IsOptional()
  commitHash?: string;

  @IsString()
  @IsOptional()
  gitBranchName?: string;

  @IsString()
  @IsOptional()
  workspaceBranchId?: string;
}

export class AppGitPullUpdateDto {
  @IsString()
  @IsOptional()
  gitAppName?: string;

  @IsString()
  @IsOptional()
  gitVersionName?: string;

  @IsOptional()
  gitBranchName?: string;

  @IsString()
  @IsOptional()
  currentVersionId?: string;

  @IsString()
  @IsOptional()
  commitHash?: string;

  @IsBoolean()
  @IsOptional()
  isVersionTag?: boolean;

  @IsOptional()
  taggedVersionName?: string;
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

export class AppCommitInfoDto {
  @IsString()
  @IsNotEmpty()
  commitId: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  date?: string;
}
