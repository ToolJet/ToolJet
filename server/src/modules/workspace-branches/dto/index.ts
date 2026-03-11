import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateBranchDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  sourceBranchId?: string;
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
}

export class WorkspacePullDto {
  @IsOptional()
  @IsString()
  sourceBranch?: string;
}
