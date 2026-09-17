import { IsUUID } from 'class-validator';

export class AppIdParamDto {
  @IsUUID('4', { message: 'appId must be a valid UUID' })
  appId: string;
}
