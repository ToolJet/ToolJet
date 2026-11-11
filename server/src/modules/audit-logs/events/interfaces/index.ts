import { ExecutionContext } from '@nestjs/common';
import { ActiveAuditRouteSpec, AuditableRequest, AuditEventRecord, FieldSpec, Snapshot } from '../types';
import { AuditTargetType } from '../catalog';

export interface LoadedSubject {
  id: string;
  snapshot: Snapshot;
}

/** Work captured before the handler, finished after it. */
export interface PendingAudit {
  spec: ActiveAuditRouteSpec;
  before: LoadedSubject | null;
}

/** Community edition binds a no-op; Enterprise binds the real engine. */
export abstract class IAuditEngine {
  abstract readonly isNoop: boolean;
  /** Synchronous check so routes without a spec skip all audit work. */
  abstract hasSpec(context: ExecutionContext): boolean;
  /** Before the handler: resolve the target and snapshot it. */
  abstract before(context: ExecutionContext): Promise<PendingAudit | null>;
  /** After the handler resolved (the change is committed): diff and persist. */
  abstract after(pending: PendingAudit, context: ExecutionContext, result: unknown): Promise<void>;
  /** Called by the permission guard when it rejects a request. */
  abstract denied(context: ExecutionContext): Promise<void>;
  /**
   * Runs audit work that follows the handler. It is awaited when the sink writes before the
   * response, and left running in the background when the sink queues after it.
   */
  abstract schedule(work: () => Promise<void>): Promise<void>;
}

/** Knows how to load and describe one kind of audited resource. */
export interface IAuditSubjectAdapter {
  readonly targetType: AuditTargetType;
  readonly fields: FieldSpec;
  loadBefore(identifier: string, request: AuditableRequest): Promise<LoadedSubject | null>;
  fromResponse(body: unknown): LoadedSubject | null;
  /** Current state by resolved id, for specs with `after: 'reload'`. */
  loadCurrent(id: string): Promise<LoadedSubject | null>;
  displayName(snapshot: Snapshot): string;
  /** Target of a denied request, from what the request names (no DB read). */
  describeRequest(request: AuditableRequest): { id: string | null; displayName: string };
}

export const AUDIT_SUBJECT_ADAPTERS = Symbol('AUDIT_SUBJECT_ADAPTERS');

export abstract class IAuditSink {
  abstract write(events: AuditEventRecord[]): Promise<void>;
  /** True when writes may finish after the response has been sent. */
  runsAfterResponse(): boolean {
    return false;
  }
}
