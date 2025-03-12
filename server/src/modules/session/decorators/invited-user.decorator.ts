import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { App } from '@entities/app.entity';

export const InvitedUser = createParamDecorator((data: unknown, ctx: ExecutionContext): App => {
  const request = ctx.switchToHttp().getRequest();
  return request.invitedUser;
});
