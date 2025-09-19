import { DynamicModule } from '@nestjs/common';

export class LogToFileModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    return {
      module: LogToFileModule,
      providers: [],
      exports: [],
    };
  }
}
