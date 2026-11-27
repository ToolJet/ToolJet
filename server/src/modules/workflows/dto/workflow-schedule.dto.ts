import { IsBoolean, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

/*
 * Request bodies for the schedule routes. The global ValidationPipe only whitelists class DTOs, so
 * these list exactly what a client may set; anything else (id, appId, ...) is dropped.
 */

export interface WorkflowScheduleDetails {
  frequency?: string;
  minutes?: number;
  hour?: string;
  date?: string | number;
  [setting: string]: unknown;
}

export class CreateWorkflowScheduleDto {
  /** The workflow version the schedule runs. */
  @IsUUID()
  workflowId: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  active: boolean;

  @IsOptional()
  @IsUUID()
  environmentId: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  timezone: string;

  @IsObject()
  details: WorkflowScheduleDetails;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}

/** Edits settings only; pausing and resuming go through ActivateWorkflowScheduleDto. */
export class UpdateWorkflowScheduleDto {
  /** Another version of the same workflow. */
  @IsOptional()
  @IsUUID()
  workflowId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  environmentId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  details?: WorkflowScheduleDetails;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown> | null;
}

export class ActivateWorkflowScheduleDto {
  @IsBoolean()
  active: boolean;
}
