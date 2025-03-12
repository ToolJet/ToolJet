import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User as UserEntity } from '@entities/user.entity';

const User = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

export { User, UserEntity };
