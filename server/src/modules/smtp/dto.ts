import { IsBoolean, IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '@helpers/utils.helper';
import { INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';
export class UpdateSMTPSettingsDto {
  @IsNotEmpty({ message: 'Host should not be empty' })
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  host: string;

  @IsNotEmpty({ message: 'Port should not be empty' })
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  port: string;

  @IsNotEmpty({ message: 'User should not be empty' })
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  user: string;

  @IsNotEmpty({ message: 'Password should not be empty' })
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  password: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : sanitizeInput(value)))
  @IsEmail({}, { message: 'From email is invalid' })
  fromEmail: string;
}

export class UpdateSmtpEnvSettingChangedDto {
  @IsNotEmpty()
  @IsBoolean()
  smtpEnvEnabled: boolean;
}

export class UpdateSmtpStatusChangedDto {
  @IsNotEmpty()
  @IsBoolean()
  smtpEnabled: boolean;
}

export class ListSMTPDto {
  constructor(settings) {
    this.smtpEnabled = settings[INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED] === 'true';
    this.host = settings[INSTANCE_SYSTEM_SETTINGS.SMTP_DOMAIN];
    this.port = settings[INSTANCE_SYSTEM_SETTINGS.SMTP_PORT];
    this.user = settings[INSTANCE_SYSTEM_SETTINGS.SMTP_USERNAME];
    this.password = settings[INSTANCE_SYSTEM_SETTINGS.SMTP_PASSWORD];
    this.fromEmail = settings[INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL];
    this.smtpEnvEnabled = settings[INSTANCE_SYSTEM_SETTINGS.SMTP_ENV_CONFIGURED] === 'true';
  }
  smtpEnabled: boolean;
  host: string;
  port: string;
  user: string;
  password: string;
  fromEmail: string;
  smtpEnvEnabled: boolean;
}
