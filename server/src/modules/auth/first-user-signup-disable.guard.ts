import { Injectable, CanActivate } from '@nestjs/common';
import { LicenseCountsService } from '@services/license_counts.service';
@Injectable()
export class FirstUserSignupDisableGuard implements CanActivate {
  constructor(private licenseCountsService: LicenseCountsService) {}

  async canActivate(): Promise<any> {
    return (await this.licenseCountsService.getUsersCount()) !== 0;
  }
}
