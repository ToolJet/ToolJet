import { DynamicModule, Module } from '@nestjs/common';
import { TransactionLogger } from './service';
import { TypeormLoggerService } from './services/typeorm-logger.service';

@Module({})
export class LoggingModule {
  static forRoot(): DynamicModule {
    const providers = [
      TransactionLogger,
      ...(process.env.DISABLE_CUSTOM_QUERY_LOGGING !== 'true' ? [TypeormLoggerService] : []),
    ];

    return {
      module: LoggingModule,
      providers,
      global: true,
      exports: providers,
    };
  }
}
