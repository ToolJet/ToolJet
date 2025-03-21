import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Ability, MongoQuery } from '@casl/ability';

export const AbilityDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Ability<[any, any], MongoQuery> => {
    const request = ctx.switchToHttp().getRequest();
    return request.tj_ability;
  }
);

export interface AppAbility extends Ability<[any, any], MongoQuery> {}
