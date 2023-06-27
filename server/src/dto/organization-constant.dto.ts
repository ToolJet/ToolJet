import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class CreateOrganizationConstantDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  constant_name: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  environments: string[];

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class UpdateOrganizationConstantDto {
  @IsString()
  @IsNotEmpty()
  value?: string;

  @IsString()
  @IsNotEmpty()
  environment_id?: string;

  @IsString()
  @IsNotEmpty()
  constant_name?: string;
}
