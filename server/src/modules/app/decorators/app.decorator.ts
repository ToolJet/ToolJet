import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { App } from 'src/entities/app.entity';
import { cloneDeep } from 'lodash';

export const AppDecorator = createParamDecorator((data: unknown, ctx: ExecutionContext): App => {
  const request = ctx.switchToHttp().getRequest();
  return cloneDeep(request.tj_app) as App;
});
