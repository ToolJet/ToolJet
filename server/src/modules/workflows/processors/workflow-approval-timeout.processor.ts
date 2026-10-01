import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowApprovalTimeoutProcessor {
  constructor() {}

  async process(job: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
