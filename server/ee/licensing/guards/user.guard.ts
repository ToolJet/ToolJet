import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { UsersService } from '@services/users.service';
import { LicenseService } from '@services/license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';
import { LICENSE_LIMIT } from 'src/helpers/license.helper';

@Injectable()
export class UserCountGuard implements CanActivate {
  constructor(private usersService: UsersService, private licenseService: LicenseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const totalUsers = await this.licenseService.getLicenseTerms(LICENSE_FIELD.TOTAL_USERS);
    if (totalUsers !== LICENSE_LIMIT.UNLIMITED && (await this.usersService.getCount(true)) >= totalUsers) {
      throw new HttpException('License violation - Maximum user limit reached', 451);
    }
    return true;
  }
}
