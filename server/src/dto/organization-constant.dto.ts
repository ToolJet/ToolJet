import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';

export class CreateOrganizationConstantDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  constant_name: string;

  @IsString()
  @IsNotEmpty()
  environment_id: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class UpdateOrganizationConstantDto extends PartialType(CreateOrganizationConstantDto) {
  @IsString()
  @IsNotEmpty()
  value?: string;
}
