import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { IAuditEngine } from './interfaces';

// Global so the APP_INTERCEPTOR and the permission guard can reach the engine from any module.
// The edition decides the implementation: Community loads a no-op, Enterprise the real engine.
export class AuditEventsModule extends SubModule {
  static async forRoot(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { AuditEngineService, AUDIT_ENGINE_PROVIDERS } = await this.getProviders(configs, 'audit-logs', [
      'events/engine.service',
    ]);

    return {
      module: AuditEventsModule,
      global: true,
      providers: [...AUDIT_ENGINE_PROVIDERS, { provide: IAuditEngine, useClass: AuditEngineService }],
      exports: [IAuditEngine],
    };
  }
}
