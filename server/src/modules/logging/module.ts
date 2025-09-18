import { Global, Module } from '@nestjs/common';
import { TransactionLogger } from './service';

@Global()
@Module({
  providers: [TransactionLogger],
  exports: [TransactionLogger],
})
export class LoggingModule {}
