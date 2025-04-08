import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';
import { SSOType } from 'src/entities/sso_config.entity';
import { FeatureGuard } from './feature.guard';
import { LICENSE_FIELD } from '../constants';

@Injectable()
export class SSOGuard implements CanActivate {
  constructor(protected featureGuard: FeatureGuard) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const type = request.body.type; // Directly extract 'type' from the request

    // Check if type is valid
    if (!Object.values(SSOType).includes(type)) {
      throw new BadRequestException('Invalid SSO type');
    }

    switch (type) {
      case 'openid':
        return this.featureGuard.setFeatureId(LICENSE_FIELD.OIDC).canActivate(context);
      case 'ldap':
        return this.featureGuard.setFeatureId(LICENSE_FIELD.LDAP).canActivate(context);
      case 'saml':
        return this.featureGuard.setFeatureId(LICENSE_FIELD.SAML).canActivate(context);
      default:
        return true;
    }
  }
}
