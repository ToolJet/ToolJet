import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LICENSE_FIELD } from '../constants';
import { LicenseTermsService } from '../interfaces/IService';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    protected reflector: Reflector,
    protected licenseTermsService: LicenseTermsService
  ) {}

  protected currentFeatureId: string;

  // Method to set current feature ID
  setFeatureId(featureId: LICENSE_FIELD) {
    this.currentFeatureId = featureId;
    return this;
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const licenseFeatureId = (this.reflector.get<LICENSE_FIELD>('tjLicenseFeatureId', context.getHandler()) ||
      this.currentFeatureId) as LICENSE_FIELD;

    if (
      !licenseFeatureId ||
      !(await this.licenseTermsService.getLicenseTerms(licenseFeatureId, request?.user?.organizationId))
    ) {
      throw new HttpException(
        `Oops! Your current plan doesn't have access to this feature. Please upgrade your plan now to use this.`,
        451
      );
    }

    return true;
  }
}
