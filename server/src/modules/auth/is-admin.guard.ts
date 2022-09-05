import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UsersService } from '@services/users.service';

@Injectable()
export class IsAdminGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const isAdmin = await this.usersService.hasGroup(request?.user, 'admin');
    return isAdmin;
  }
}
