import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { INSTANCE_SYSTEM_SETTINGS } from '../instance-settings/constants';

export class ListSslConfigurationDto {
  enabled: boolean;
  email: string;
  staging: boolean;
  domain: string;
  fullchainPem: string;
  privkeyPem: string;
  certPem: string;
  chainPem: string;
  acquiredAt: string; // ISO 8601 string or empty
  expiresAt: string; // ISO 8601 string or empty

  constructor(settings: Record<string, any>) {
    this.enabled = settings[INSTANCE_SYSTEM_SETTINGS.SSL_ENABLED] === 'true';
    this.email = settings[INSTANCE_SYSTEM_SETTINGS.SSL_EMAIL] || '';
    this.staging = settings[INSTANCE_SYSTEM_SETTINGS.SSL_STAGING] === 'true';
    this.domain = settings[INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN] || '';
    this.fullchainPem = settings[INSTANCE_SYSTEM_SETTINGS.SSL_FULLCHAIN_PEM] || '';
    this.privkeyPem = settings[INSTANCE_SYSTEM_SETTINGS.SSL_PRIVKEY_PEM] || '';
    this.certPem = settings[INSTANCE_SYSTEM_SETTINGS.SSL_CERT_PEM] || '';
    this.chainPem = settings[INSTANCE_SYSTEM_SETTINGS.SSL_CHAIN_PEM] || '';
    this.acquiredAt = settings[INSTANCE_SYSTEM_SETTINGS.SSL_ACQUIRED_AT] || '';
    this.expiresAt = settings[INSTANCE_SYSTEM_SETTINGS.SSL_EXPIRES_AT] || '';
  }
}

export class UpdateSslConfigurationDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  staging?: boolean;

  @IsString()
  @IsOptional()
  domain?: string;
}

export class UpdateSslCertificateDto {
  @IsString()
  fullchainPem: string;

  @IsString()
  privkeyPem: string;

  @IsString()
  certPem: string;

  @IsString()
  chainPem: string;

  @IsString()
  acquiredAt: string; // ISO 8601

  @IsString()
  expiresAt: string; // ISO 8601
}
