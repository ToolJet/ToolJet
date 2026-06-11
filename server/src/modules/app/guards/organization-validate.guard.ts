import { User } from '@entities/user.entity';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class OrganizationValidateGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { organizationId } = request.params;
    const user: User = request.user;
    return user.organizationId === organizationId;
  }
}
