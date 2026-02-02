import { IsBoolean, IsEmail, IsOptional, IsString, MinLength, MaxLength, ValidateIf, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { INSTANCE_SYSTEM_SETTINGS } from '../instance-settings/constants';
import { validateDomainFormat } from '@ee/ssl-configuration/utils';

/**
 * Custom validator decorator that uses the validateDomainFormat utility
 */
function IsDomainFormat(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDomainFormat',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }
          try {
            validateDomainFormat(value);
            return true;
          } catch (error) {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return 'Domain must be a valid subdomain (e.g., tooljet.company.com)';
        },
      },
    });
  };
}

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
  previousDomain: string;
  domainChangeRequested: boolean;
  newDomain: string;

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
    this.previousDomain = settings[INSTANCE_SYSTEM_SETTINGS.SSL_PREVIOUS_DOMAIN] || '';
    this.domainChangeRequested = settings[INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN_CHANGE_REQUESTED] === 'true';
    this.newDomain = settings[INSTANCE_SYSTEM_SETTINGS.SSL_NEW_DOMAIN] || '';
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

  @IsOptional()
  @ValidateIf((o) => o.domain !== undefined && o.domain !== null && o.domain !== '')
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @IsDomainFormat()
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

export class RequestDomainChangeDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @IsDomainFormat()
  newDomain: string;
}
