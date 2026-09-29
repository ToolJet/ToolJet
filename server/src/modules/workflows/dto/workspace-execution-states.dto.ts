import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

// Each id costs about two Redis round trips, so the list is capped at the largest executions page.
export const MAX_WORKSPACE_STATE_IDS = 100;

export class WorkspaceExecutionStatesDto {
  @IsArray()
  @ArrayMaxSize(MAX_WORKSPACE_STATE_IDS)
  @IsUUID('all', { each: true })
  executionIds: string[];
}
