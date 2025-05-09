import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class PreviewWorkflowNodeDto {
  @IsString()
  @IsNotEmpty()
  queryId: string;

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
  @IsOptional()
  appEnvId?: string;
}
