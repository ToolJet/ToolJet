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

  /*
   * The app-builder sends this on every workflow-query trigger, but it was never declared
   * here, so the global ValidationPipe ({ whitelist: true }) silently stripped it before the
   * handler ran. Guards read the raw body, which is why WorkflowTriggerAuthGuard still sees it.
   */
  @IsString()
  @IsOptional()
  queryId?: string;

  @IsOptional()
  @IsObject()
  injectedState?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  syncExecution?: boolean;
}