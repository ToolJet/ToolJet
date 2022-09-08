import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { UsersService } from '@services/users.service';
import License from '../configs/License';

@Injectable()
export class UserCountGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const license = License.Instance;
    if (license.users !== 'UNLIMITED' && (await this.usersService.getCount(true)) >= license.users) {
      throw new HttpException('License violation - Maximum user limit reached', 451);
    }
    return true;
  }
}
