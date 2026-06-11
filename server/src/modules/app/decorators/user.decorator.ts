import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User as UserEntity } from '@entities/user.entity';
import { cloneDeep } from 'lodash';

const User = createParamDecorator((data: unknown, ctx: ExecutionContext): UserEntity => {
  const request = ctx.switchToHttp().getRequest();
  return cloneDeep(request.user) as UserEntity;
});

export { User, UserEntity };
