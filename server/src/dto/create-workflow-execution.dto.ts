import { IsString, IsNotEmpty, ValidateIf, IsObject, IsOptional, IsBoolean } from 'class-validator';
import { isUndefined } from 'lodash';

export class CreateWorkflowExecutionDto {
  @IsString()
  @IsNotEmpty()
  executeUsing: string;

  @ValidateIf((requestData) => isUndefined(requestData.executeUsing === 'version'))
  @IsString()
  @IsNotEmpty()
  appVersionId: string;

  @ValidateIf((requestData) => isUndefined(requestData.executeUsing === 'app'))
  @IsString()
  @IsNotEmpty()
  appId: string;

  @IsOptional()
  @IsObject()
  params: object;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  app?: string;

  @IsString()
  @IsNotEmpty()
  environmentId: string;

  @IsString()
  @IsOptional()
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
  injectedState?: object;

  @IsOptional()
  @IsBoolean()
  syncExecution?: boolean;
}
