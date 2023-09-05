import { IsString, IsNotEmpty, IsEmail, IsOptional, IsObject, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowercaseString, sanitizeInput } from 'src/helpers/utils.helper';

export class CreateTrialLicenseDto {
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
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(500)
  hostname: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(200)
  subpath: string;

  @IsObject()
  @IsOptional()
  otherData: object;
}
