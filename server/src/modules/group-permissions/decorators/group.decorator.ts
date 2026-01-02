import { GroupPermissions } from '@entities/group_permissions.entity';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { cloneDeep } from 'lodash';

export const Group = createParamDecorator((data: unknown, ctx: ExecutionContext): GroupPermissions => {
  const request = ctx.switchToHttp().getRequest();
  return cloneDeep(request.group) as GroupPermissions;
});
