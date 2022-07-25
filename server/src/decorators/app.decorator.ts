import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const App = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.app;
});
