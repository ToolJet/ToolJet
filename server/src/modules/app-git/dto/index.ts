import { IsString, IsNotEmpty } from 'class-validator';

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

  @IsString()
  gitVersionId: string;

  @IsString()
  lastCommitMessage: string;

  @IsString()
  lastCommitUser: string;

  @IsString()
  lastPushDate: string;

  @IsString()
  organizationGitId: string;

  @IsString()
  gitAppName: string;

  @IsString()
  gitVersionName: string;
}

export class AppGitPullUpdateDto {
  @IsString()
  gitVersionId: string;

  @IsString()
  lastCommitMessage: string;

  @IsString()
  lastCommitUser: string;

  @IsString()
  lastPushDate: string;

  @IsString()
  gitAppName: string;

  @IsString()
  gitVersionName: string;
}
