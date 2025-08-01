import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPermissions } from '@modules/ability/types';
import { cloneDeep } from 'lodash';

export const UserPermissionsDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPermissions => {
    const request = ctx.switchToHttp().getRequest();
    return cloneDeep(request.tj_user_permissions) as UserPermissions;
  }
);
