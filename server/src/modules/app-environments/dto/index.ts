import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';

export class CreateAppEnvironmentDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  name: string;
}

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

export class UpdateAppEnvironmentDto extends PartialType(CreateAppEnvironmentDto) {}
