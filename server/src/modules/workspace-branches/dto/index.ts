import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsIn,
  ValidateNested,
  IsBoolean,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type, Exclude, Expose } from 'class-transformer';
import { PullDiagnostics } from '../types';

// Mirrors `git check-ref-format --branch`: names git refuses would only fail later, in the worker.
@ValidatorConstraint({ name: 'isGitBranchName', async: false })
class GitBranchNameConstraint implements ValidatorConstraintInterface {
  validate(name: unknown): boolean {
    if (typeof name !== 'string' || name.trim() === '' || name === '@') return false;
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x20\x7f~^:?*[\\]/.test(name) || name.includes('..') || name.includes('@{')) return false;
    if (name.endsWith('.') || name.startsWith('/') || name.endsWith('/') || name.includes('//')) return false;
    return name.split('/').every((part) => !part.startsWith('.') && !part.endsWith('.lock'));
  }

  defaultMessage(): string {
    return 'name is not a valid git branch name';
  }
}

export class CreateBranchDto {
  @IsNotEmpty()
  @IsString()
  @Validate(GitBranchNameConstraint)
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

@Exclude()
export class CreateBranchResponseDto {
  @Expose() enqueued: boolean;
  @Expose() isImport: boolean;
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
  scope?: 'app' | 'module' | 'workflow' | 'datasource' | 'all';
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

@Exclude()
export class PullDiagnosticsDto implements PullDiagnostics {
  @Expose() stage: PullDiagnostics['stage'];
  @Expose() pod: string;
  @Expose() attempt?: number;
  @Expose() totalMs: number;
  @Expose() phases: PullDiagnostics['phases'];
  @Expose() skips: PullDiagnostics['skips'];
  @Expose() gitCache?: PullDiagnostics['gitCache'];
  @Expose() resources?: PullDiagnostics['resources'];
}

@Exclude()
export class WorkspacePullResponseDto {
  @Expose() success: boolean;

  @Expose() upToDate?: boolean;

  @Expose()
  @Type(() => PullDiagnosticsDto)
  diagnostics?: PullDiagnosticsDto;
}

export class PullConflictResolutionDto {
  @IsIn(['app', 'module', 'datasource', 'workflow'])
  type: 'app' | 'module' | 'datasource' | 'workflow';

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
