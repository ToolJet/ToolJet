import { GroupPermissions } from '@entities/group_permissions.entity';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Group = createParamDecorator((data: unknown, ctx: ExecutionContext): GroupPermissions => {
  const request = ctx.switchToHttp().getRequest();
  return request.group;
});
