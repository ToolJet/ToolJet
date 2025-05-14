import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestContextMiddleware } from './middleware';

@Module({
  providers: [RequestContextMiddleware],
  exports: [RequestContextMiddleware],
})
export class RequestContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
