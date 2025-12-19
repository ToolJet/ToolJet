export enum SandboxMode {
  ENABLED = 'ENABLED',   // Sandboxed execution via nsjail
  BYPASSED = 'BYPASSED', // No sandbox - development/restricted environments
}

export interface ExecutionResult {
  status: 'ok' | 'error';
  data?: any;
  error?: string;
  trace?: string;
  executionTimeMs: number;
}

export interface IPythonExecutorService {
  execute(
    code: string,
    state: Record<string, any>,
    bundleId: string | null,
    timeout: number
  ): Promise<ExecutionResult>;
}
