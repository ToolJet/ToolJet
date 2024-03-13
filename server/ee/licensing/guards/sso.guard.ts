import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';
import { OIDCGuard } from './oidc.guard';
import { LDAPGuard } from './ldap.guard';
import { SAMLGuard } from './saml.guard';
import { SSOType } from 'src/entities/sso_config.entity';

@Injectable()
export class SSOGuard implements CanActivate {
  constructor(
    private oidcGuard: OIDCGuard, 
    private ldapGuard: LDAPGuard, 
    private samlGuard: SAMLGuard
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const type = request.body.type; // Directly extract 'type' from the request
    const organizationId = request.headers['tj-workspace-id'];
    request.organizationId = organizationId;

    // Check if type is valid
    if (!Object.values(SSOType).includes(type)) {
      throw new BadRequestException('Invalid SSO type');
    }

    switch (type) {
      case 'openid':
        return await this.oidcGuard.canActivate(context);
      case 'ldap':
        return await this.ldapGuard.canActivate(context);
      case 'saml':
        return await this.samlGuard.canActivate(context);
      default:
        return true;
    }
  }
}
