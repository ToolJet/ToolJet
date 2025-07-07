import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { ORGANIZATION_INSTANCE_KEY } from '@modules/licensing/constants';
import { LicenseCountsService } from '@modules/licensing/services/count.service';
import { Injectable, CanActivate } from '@nestjs/common';
@Injectable()
export class FirstUserSignupGuard implements CanActivate {
  constructor(protected readonly licenseCountsService: LicenseCountsService) {}

  async canActivate(): Promise<any> {
    if (getTooljetEdition() === TOOLJET_EDITIONS.Cloud) {
      // Not needed for cloud edition, as it is not used in the cloud
      return false;
    }
    return (await this.licenseCountsService.getUsersCount(ORGANIZATION_INSTANCE_KEY)) === 0;
  }
}
