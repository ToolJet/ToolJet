import { IsEmail, IsOptional, IsString, IsBoolean } from 'class-validator';

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
  isInvited?: boolean;

  @IsOptional()
  @IsBoolean()
  isSignedUpUsingGoogleSSO?: boolean;

  @IsOptional()
  @IsBoolean()
  isSignedUpUsingGithubSSO?: boolean;

  @IsOptional()
  utmParams?: UtmParamsDto;

  [key: string]: any;
}
