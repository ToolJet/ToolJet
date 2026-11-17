import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Read-only resolution using the same version rules as workflow execution. */
export class ResolveWorkflowVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pin?: string;

  @IsOptional()
  @IsUUID()
  consumer_version_id?: string;
}

export type ResolvedWorkflowVersion = {
  workflow_id: string;
  version_id: string | null;
  pin: string | null;
};
