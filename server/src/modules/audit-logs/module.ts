import { Module, DynamicModule } from '@nestjs/common';

@Module({})
export class AuditLogsModule {
  static async register(): Promise<DynamicModule> {
    return {
      module: AuditLogsModule,
    };
  }
}
