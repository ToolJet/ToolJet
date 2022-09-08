import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import License from '../configs/License';

@Injectable()
export class LicenseExpiryGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (License.Instance.isExpired()) {
      throw new HttpException('License expired', 451);
    }
    return true;
  }
}
