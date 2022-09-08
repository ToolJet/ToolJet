import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import License from '../configs/License';

@Injectable()
export class OIDCGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!License.Instance.oidc) {
      throw new HttpException('OIDC not enabled', 451);
    }
    return true;
  }
}
