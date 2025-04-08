import { LicenseCountsService } from '@modules/licensing/services/count.service';
import { Injectable, CanActivate } from '@nestjs/common';
@Injectable()
export class FirstUserSignupGuard implements CanActivate {
  constructor(protected readonly licenseCountsService: LicenseCountsService) {}

  async canActivate(): Promise<any> {
    return (await this.licenseCountsService.getUsersCount()) === 0;
  }
}
