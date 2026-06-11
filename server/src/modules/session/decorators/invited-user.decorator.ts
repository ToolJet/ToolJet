import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { cloneDeep } from 'lodash';
import { User } from '@sentry/node';

export const InvitedUser = createParamDecorator((data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  return cloneDeep(request.invitedUser) as User;
});
