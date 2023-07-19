import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class CreateOrganizationConstantDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: 'Constant name must start with a letter or underscore and contain only letters, numbers, and underscores',
  })
  @MaxLength(32, { message: 'Column name must be less than 32 characters' })
  @MinLength(1, { message: 'Column name must be at least 1 character' })
  constant_name: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  environments: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Column name must be at least 1 character' })
  @MaxLength(10000, { message: 'Column name must be less than 10000 characters' })
  value: string;
}

export class UpdateOrganizationConstantDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Column name must be at least 1 character' })
  @MaxLength(10000, { message: 'Column name must be less than 10000 characters' })
  value?: string;

  @IsString()
  @IsNotEmpty()
  environment_id?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(20, { message: 'Column name must be less than 32 characters' })
  @MinLength(1, { message: 'Column name must be at least 1 character' })
  constant_name?: string;
}
