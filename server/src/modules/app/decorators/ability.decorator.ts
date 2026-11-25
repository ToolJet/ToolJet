import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Ability, MongoQuery } from '@casl/ability';
import { cloneDeep } from 'lodash';

export const AbilityDecorator = createParamDecorator(
  (key: string | undefined, ctx: ExecutionContext): Ability<[any, any], MongoQuery> => {
    const request = ctx.switchToHttp().getRequest();
    return cloneDeep(request[key ?? 'tj_ability']) as Ability<[any, any], MongoQuery>;
  }
);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AppAbility extends Ability<[any, any], MongoQuery> {}
