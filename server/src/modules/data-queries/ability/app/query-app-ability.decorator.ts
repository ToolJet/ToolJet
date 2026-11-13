import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppAbility } from '@modules/app/decorators/ability.decorator';

/** The ability on the query's app, as the app guard (./guard.ts) worked it out; undefined when that guard did not run. */
export const QueryAppAbility = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AppAbility | undefined => ctx.switchToHttp().getRequest().tj_query_app_ability
);
