import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { ApprovalTimerJobData } from '../types';

@Injectable()
export class WorkflowApprovalTimeoutProcessor {
  constructor() {}

  async process(job: Job<ApprovalTimerJobData>): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
