import { DynamicModule, ExecutionContext, Injectable, Provider } from '@nestjs/common';
import { IAuditEngine, PendingAudit } from './interfaces';

// Audit events are an Enterprise feature; Community builds pay nothing.
@Injectable()
export class AuditEngineService extends IAuditEngine {
  readonly isNoop = true;

  hasSpec(_context: ExecutionContext): boolean {
    return false;
  }

  async before(_context: ExecutionContext): Promise<PendingAudit | null> {
    return null;
  }

  async after(_pending: PendingAudit, _context: ExecutionContext, _result: unknown): Promise<void> {}

  async denied(_context: ExecutionContext): Promise<void> {}

  async schedule(work: () => Promise<void>): Promise<void> {
    await work();
  }
}

export const AUDIT_ENGINE_PROVIDERS: Provider[] = [];
export const auditEngineImports = (): DynamicModule[] => [];
export const AUDIT_WORKER_PROVIDERS: Provider[] = [];
