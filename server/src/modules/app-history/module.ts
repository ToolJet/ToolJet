import { DynamicModule, Module } from '@nestjs/common';
import { AppHistoryService } from './service';
import { AppHistoryController } from './controller';

@Module({})
export class AppHistoryModule {
  static async register(_configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    return {
      module: AppHistoryModule,
      providers: [AppHistoryService],
      controllers: [AppHistoryController],
      exports: [AppHistoryService],
    };
  }
}
