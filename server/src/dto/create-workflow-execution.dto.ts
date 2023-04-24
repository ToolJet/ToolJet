import { IsString, IsNotEmpty, ValidateIf } from 'class-validator';
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

  @IsString()
  @IsNotEmpty()
  userId: string;
}
