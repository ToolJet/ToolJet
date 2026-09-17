import { IsNotEmpty, IsString, IsOptional, IsUUID, IsArray, IsIn, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBranchDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  sourceBranchId?: string;

  @IsOptional()
  @IsString()
  commitSha?: string;

  @IsOptional()
  @IsUUID()
  appId?: string;

  @IsOptional()
  @IsUUID()
  versionId?: string;

  // When the branch name was already found on remote and the user confirmed
  // via the import-confirmation modal, skip the pre-creation existence check.
  @IsOptional()
  @IsBoolean()
  confirmImport?: boolean;
}

export class SwitchBranchDto {
  @IsNotEmpty()
  @IsUUID()
  branchId: string;
}

export class WorkspacePushDto {
  @IsNotEmpty()
  @IsString()
  commitMessage: string;

  @IsOptional()
  @IsString()
  targetBranch?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  deletionOnly?: boolean;

  // Internal only (set by the app-deletion worker, never from an HTTP body): the exact
  // co_relation_ids to remove from the repo on a deletionOnly push. Scopes the removal to the
  // apps that were actually deleted instead of a DB-vs-git diff.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deletionCoRelIds?: string[];

  @IsOptional()
  @IsString()
  scope?: 'app' | 'module' | 'datasource' | 'all';
  @IsOptional()
  @IsBoolean()
  onlyUnsyncedDatasources?: boolean;
}

export class WorkspacePullDto {
  @IsOptional()
  @IsString()
  sourceBranch?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}

export class PullConflictResolutionDto {
  @IsIn(['app', 'module', 'datasource'])
  type: 'app' | 'module' | 'datasource';

  @IsUUID()
  existingCoRelationId: string;

  @IsUUID()
  incomingCoRelationId: string;
}

export class ResolveConflictsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PullConflictResolutionDto)
  resolutions: PullConflictResolutionDto[];

  @IsOptional()
  @IsUUID()
  branchId?: string;
}

export class PullAppDto {
  @IsNotEmpty()
  @IsUUID()
  appId: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsString()
  tagSha?: string;

  @IsOptional()
  @IsString()
  tagName?: string;

  @IsOptional()
  @IsString()
  tagDescription?: string;
}

export class PullModuleDto {
  @IsNotEmpty()
  @IsUUID()
  moduleId: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsString()
  tagSha?: string;

  @IsOptional()
  @IsString()
  tagName?: string;

  @IsOptional()
  @IsString()
  tagDescription?: string;
}

export class EnsureDraftDto {
  @IsNotEmpty()
  @IsUUID()
  appId: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  // Present when the user selected a git tag instead of "Latest commit"
  @IsOptional()
  @IsString()
  tagSha?: string;

  // Full tag name (e.g. "my-app/v1") used to populate source_tag on the version
  @IsOptional()
  @IsString()
  tagName?: string;
}
