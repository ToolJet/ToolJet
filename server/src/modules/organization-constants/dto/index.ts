import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../../../helpers/utils.helper';
import { OrganizationConstantType } from '../constants';

export class CreateOrganizationConstantDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: 'Constant name must start with a letter or underscore and contain only letters, numbers, and underscores',
  })
  @MaxLength(50, { message: 'Constant name must be less than 50 characters' })
  @MinLength(1, { message: 'Constant name must be at least 1 character' })
  constant_name: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  environments: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Constant value must be at least 1 character' })
  @MaxLength(10000, { message: 'Constant value must be less than 10000 characters' })
  value: string;

  @IsEnum(OrganizationConstantType, { message: 'Type must be either Global or Secret' })
  @IsNotEmpty()
  type: OrganizationConstantType;
}

export class UpdateOrganizationConstantDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Constant value must be at least 1 character' })
  @MaxLength(10000, { message: 'Constant value must be less than 10000 characters' })
  value?: string;

  @IsString()
  @IsNotEmpty()
  environment_id?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(32, { message: 'Constant name must be less than 32 characters' })
  @MinLength(1, { message: 'Constant name must be at least 1 character' })
  constant_name?: string;
}
