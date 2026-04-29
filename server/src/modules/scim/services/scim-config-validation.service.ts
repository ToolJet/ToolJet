import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function isBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length === 0;
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

@Injectable()
export class ScimConfigValidationService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const scimEnabled = this.configService.get<string>('SCIM_ENABLED') === 'true';

    if (!scimEnabled) {
      return;
    }

    const basicAuthUser = this.configService.get<string>('SCIM_BASIC_AUTH_USER');
    const basicAuthPass = this.configService.get<string>('SCIM_BASIC_AUTH_PASS');
    const headerAuthToken = this.configService.get<string>('SCIM_HEADER_AUTH_TOKEN');

    if (isBlankString(basicAuthUser) || isBlankString(basicAuthPass)) {
      throw new Error(
        'SCIM is enabled but Basic authentication contains blank values. ' +
          'Set both SCIM_BASIC_AUTH_USER and SCIM_BASIC_AUTH_PASS to non-empty values or unset both variables.'
      );
    }

    if (isBlankString(headerAuthToken)) {
      throw new Error(
        'SCIM is enabled but SCIM_HEADER_AUTH_TOKEN is blank. Set a non-empty header token or unset the variable.'
      );
    }

    const hasBasicUser = isNonBlankString(basicAuthUser);
    const hasBasicPass = isNonBlankString(basicAuthPass);

    if (hasBasicUser !== hasBasicPass) {
      throw new Error(
        'SCIM is enabled but Basic authentication is incomplete. ' +
          'Set both SCIM_BASIC_AUTH_USER and SCIM_BASIC_AUTH_PASS.'
      );
    }

    const hasBasicAuth = hasBasicUser && hasBasicPass;
    const hasHeaderAuth = isNonBlankString(headerAuthToken);

    if (!hasBasicAuth && !hasHeaderAuth) {
      throw new Error(
        'SCIM is enabled but no authentication mode is fully configured. ' +
          'Set SCIM_HEADER_AUTH_TOKEN or both SCIM_BASIC_AUTH_USER and SCIM_BASIC_AUTH_PASS.'
      );
    }
  }
}
