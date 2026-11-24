import { IsString, IsNotEmpty, IsBoolean, IsOptional, Matches } from 'class-validator';

// gitAppName / gitVersionName become folder names in the git clone path — reject traversal.
const NO_PATH_TRAVERSAL = /^(?!.*\.\.)[^/\\]*$/;
const NO_PATH_TRAVERSAL_MESSAGE = 'Name must not contain "/", "\\" or ".."';

export class AppGitPushDto {
  @IsString()
  @Matches(NO_PATH_TRAVERSAL, { message: NO_PATH_TRAVERSAL_MESSAGE })
  gitAppName: string;

  @IsString()
  versionId: string;

  @IsString()
  lastCommitMessage: string;

  @IsString()
  @Matches(NO_PATH_TRAVERSAL, { message: NO_PATH_TRAVERSAL_MESSAGE })
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
  @Matches(NO_PATH_TRAVERSAL, { message: NO_PATH_TRAVERSAL_MESSAGE })
  gitAppName?: string;

  @IsString()
  @IsOptional()
  @Matches(NO_PATH_TRAVERSAL, { message: NO_PATH_TRAVERSAL_MESSAGE })
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
  @Matches(NO_PATH_TRAVERSAL, { message: NO_PATH_TRAVERSAL_MESSAGE })
  gitAppName?: string;

  @IsString()
  @IsOptional()
  @Matches(NO_PATH_TRAVERSAL, { message: NO_PATH_TRAVERSAL_MESSAGE })
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
  @Matches(/^[^/]*$/, { message: "Name should not contain '/'" })
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
