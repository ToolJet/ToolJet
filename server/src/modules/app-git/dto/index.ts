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

  @IsBoolean()
  @IsOptional()
  allowEditing: boolean;
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

  @IsString()
  @IsOptional()
  gitBranchName?: string;

  @IsBoolean()
  @IsOptional()
  allowMasterPush?: boolean;
}

export class AppGitPullDto {
  @IsString()
  gitAppId: string;

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
  organizationGitId: string;

  @IsString()
  gitAppName: string;

  @IsString()
  gitVersionName: string;

  @IsString()
  appName: string;

  @IsBoolean()
  @IsOptional()
  allowEditing: boolean;
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
  gitVersionName: string;

  @IsOptional()
  gitBranchName?: string;

  @IsString()
  @IsOptional()
  currentVersionId?: string;

  @IsString()
  @IsOptional()
  commitHash?: string;
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
