export enum SandboxMode {
  ENABLED = 'ENABLED', // Sandboxed execution via nsjail
  BYPASSED = 'BYPASSED', // No sandbox - explicit operator opt-in via TOOLJET_WORKFLOW_SANDBOX_BYPASS=true
  DISABLED = 'DISABLED', // nsjail missing and no explicit bypass - refuse to run (fail closed)
}

export interface ExecutionResult {
  status: 'ok' | 'error';
  data?: any;
  error?: string;
  trace?: string;
  executionTimeMs: number;
}

export interface IPythonExecutorService {
  /**
   * Execute Python code with optional package bundle.
   *
   * @param code - Python code to execute
   * @param state - Workflow state variables to inject
   * @param bundleContent - Pre-fetched tar.gz bundle content (symmetrical with JS bundle handling)
   * @param timeout - Execution timeout in milliseconds
   */
  execute(
    code: string,
    state: Record<string, any>,
    bundleContent: Buffer | null,
    timeout: number
  ): Promise<ExecutionResult>;
}
