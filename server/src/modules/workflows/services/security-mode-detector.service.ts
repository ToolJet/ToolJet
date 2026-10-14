import { Injectable } from '@nestjs/common';
import { SandboxMode } from '../interfaces/IPythonExecutorService';

@Injectable()
export class SecurityModeDetectorService {
  getMode(): SandboxMode {
    return SandboxMode.BYPASSED;
  }
}
