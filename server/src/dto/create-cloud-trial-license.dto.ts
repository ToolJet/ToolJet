import { IsString, IsNotEmpty, IsEmail, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowercaseString, sanitizeInput } from 'src/helpers/utils.helper';

export class CreateCloudTrialLicenseDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => lowercaseString(value))
  firstName: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => lowercaseString(value))
  @MaxLength(200)
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => lowercaseString(value))
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  customerId: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(200)
  companyName: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(200)
  organizationId: string;
}
