import { Injectable } from '@nestjs/common';
import { IPythonExecutorService, ExecutionResult } from '../interfaces/IPythonExecutorService';

@Injectable()
export class PythonExecutorService implements IPythonExecutorService {
  async execute(
    code: string,
    state: Record<string, any>,
    bundleId: string | null,
    timeout: number
  ): Promise<ExecutionResult> {
    throw new Error('Python execution is not available in Community Edition');
  }
}
