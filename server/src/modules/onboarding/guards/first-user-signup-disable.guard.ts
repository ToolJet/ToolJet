import { Injectable, CanActivate } from '@nestjs/common';
import { LicenseCountsService } from '@modules/licensing/services/count.service';
@Injectable()
export class FirstUserSignupDisableGuard implements CanActivate {
  constructor(protected readonly licenseCountsService: LicenseCountsService) {}

  async canActivate(): Promise<any> {
    return (await this.licenseCountsService.getUsersCount()) !== 0;
  }
}
