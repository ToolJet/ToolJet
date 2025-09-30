import { IsEmail, IsOptional, IsString, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UtmParamsDto {
  @IsOptional()
  @IsString()
  utm_source?: string;

  @IsOptional()
  @IsString()
  utm_medium?: string;

  @IsOptional()
  @IsString()
  utm_campaign?: string;

  @IsOptional()
  @IsString()
  utm_term?: string;

  @IsOptional()
  @IsString()
  utm_content?: string;

  @IsOptional()
  @IsString()
  utm_id?: string;
}

export class CrmIntegrationDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsBoolean()
  isTrialOpted?: boolean;

  @IsOptional()
  @IsBoolean()
  isCloudTrialOpted?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentTry?: boolean;

  @IsOptional()
  @IsBoolean()
  isInvited?: boolean;

  @IsOptional()
  @IsBoolean()
  isSignedUpUsingGoogleSSO?: boolean;

  @IsOptional()
  @IsBoolean()
  isSignedUpUsingGithubSSO?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => UtmParamsDto)
  utmParams?: UtmParamsDto;

  [key: string]: any;
}
