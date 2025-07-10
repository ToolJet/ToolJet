import { Injectable, OnModuleInit } from '@nestjs/common';
import { Observable } from 'rxjs';
import { OnEvent } from '@nestjs/event-emitter';

export const WORKFLOW_CONNECTION_TYPES = {
  INITIALIZED: 'workflow_connection_initialized',
  STREAMING: 'workflow_connection_streaming',
  ERROR: 'workflow_connection_error',
  CLOSE: 'workflow_connection_close',
};

// Base WorkflowStreamService class for CE
// This provides the interface but throws "Not implemented" errors for all methods
// EE version will extend this class and provide actual implementations
@Injectable()
export class WorkflowStreamService implements OnModuleInit {
  constructor() {}

  onModuleInit() {
    // CE version - no implementation needed
  }

  @OnEvent('workflow.status')
  handleWorkflowStatus({ executionId, status }: { executionId: string; status: any }) {
    throw new Error('Method not implemented.');
  }

  getStream(executionId: string): Observable<MessageEvent> {
    throw new Error('Method not implemented.');
  }
}
