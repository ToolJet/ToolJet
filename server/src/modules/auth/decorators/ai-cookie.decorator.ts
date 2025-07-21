import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AiCookies = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  let aiCookies = {};
  if (request.cookies['tj_ai_prompt'] || request.cookies['tj_template_id']) {
    aiCookies = {
      tj_ai_prompt: request.cookies['tj_ai_prompt'],
      tj_template_id: request.cookies['tj_template_id'],
    };
  }
  return aiCookies || {};
});
