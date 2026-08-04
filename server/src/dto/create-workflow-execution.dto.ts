import {
  IsString,
  IsNotEmpty,
  ValidateIf,
  IsObject,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateWorkflowExecutionDto {
  @IsString()
  @IsNotEmpty()
  executeUsing: string;

  @ValidateIf((o) => o.executeUsing === 'version')
  @IsString()
  @IsNotEmpty()
  appVersionId?: string;

  @ValidateIf((o) => o.executeUsing === 'app')
  @IsString()
  @IsNotEmpty()
  appId?: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, any>;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  app?: string;

  @IsString()
  @IsNotEmpty()
  environmentId: string;

  @IsOptional()
  @IsString()
  startNodeId?: string;

  @IsOptional()
  @IsObject()
  injectedState?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  syncExecution?: boolean;
}