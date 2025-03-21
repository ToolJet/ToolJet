import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LICENSE_FIELD } from '../constants';
import { LicenseTermsService } from '../interfaces/IService';
import { LICENSE_FEATURE_ID_KEY } from '@modules/app/constants';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(protected reflector: Reflector, protected licenseTermsService: LicenseTermsService) {}

  protected currentFeatureId: string;

  // Method to set current feature ID
  setFeatureId(featureId: LICENSE_FIELD) {
    this.currentFeatureId = featureId;
    return this;
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const licenseFeatureId = (this.reflector.get<LICENSE_FIELD>(LICENSE_FEATURE_ID_KEY, context.getHandler()) ||
      this.currentFeatureId) as LICENSE_FIELD;

    if (!licenseFeatureId || !(await this.licenseTermsService.getLicenseTerms(licenseFeatureId))) {
      throw new HttpException(
        `Oops! Your current plan doesn't have access to this feature. Please upgrade your plan now to use this.`,
        451
      );
    }

    return true;
  }
}
