import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { User } from '@entities/user.entity';
@Injectable()
export class QueryLibraryAccessGuard implements CanActivate {
  constructor(private readonly abilityService: AbilityService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user: User = context.switchToHttp().getRequest().user;
    if (!user) throw new ForbiddenException();
    const permissions = await this.abilityService.resourceActionsPermission(user, {
      organizationId: user.organizationId,
    });
    if (permissions.isEndUser) throw new ForbiddenException();
    return true;
  }
}
