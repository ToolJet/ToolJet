import { Injectable, CanActivate } from '@nestjs/common';
import { UsersService } from '@services/users.service';

@Injectable()
export class FirstUserSignupDisableGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(): Promise<any> {
    return (await this.usersService.getCount()) !== 0;
  }
}
