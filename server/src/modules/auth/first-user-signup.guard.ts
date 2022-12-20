import { Injectable, CanActivate } from '@nestjs/common';
import { UsersService } from '@services/users.service';

@Injectable()
export class FirstUserSignupGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(): Promise<any> {
    return (await this.usersService.getCount()) === 0;
  }
}
