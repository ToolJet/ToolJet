import { IsString, IsNotEmpty, ValidateIf, IsObject, IsOptional } from 'class-validator';
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
}
