import { IsOptional, IsUUID } from 'class-validator';

export class AppEnvironmentActionParametersDto {
  @IsOptional()
  @IsUUID()
  editorEnvironmentId: string;

  @IsOptional()
  @IsUUID()
  editorVersionId: string;

  @IsOptional()
  @IsUUID()
  deletedVersionId: string;

  @IsOptional()
  @IsUUID()
  appId: string;
}
