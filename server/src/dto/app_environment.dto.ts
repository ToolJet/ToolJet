import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { sanitizeInput } from 'src/helpers/utils.helper';

export class CreateAppEnvironmentDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  name: string;
}

export class UpdateAppEnvironmentDto extends PartialType(CreateAppEnvironmentDto) {}
