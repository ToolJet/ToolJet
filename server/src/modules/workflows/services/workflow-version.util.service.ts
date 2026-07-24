import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowVersionUtilService {
  async validateVersionEnvironmentCompatibility(appVersionId: string, environmentId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
