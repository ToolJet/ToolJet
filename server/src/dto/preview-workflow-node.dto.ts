import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class PreviewWorkflowNodeDto {
  @IsString()
  @IsOptional()
  queryId?: string;

  @IsString()
  @IsNotEmpty()
  nodeId: string;

  @IsString()
  @IsNotEmpty()
  appVersionId: string;

  @IsString()
  @IsOptional()
  app?: string;

  @IsString()
  @IsNotEmpty()
  appEnvId: string;

  @IsObject()
  @IsOptional()
  state?: Record<string, any>;
}
