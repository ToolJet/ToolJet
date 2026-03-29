import { Injectable } from '@nestjs/common';
import { JobContext } from './types';

@Injectable()
export class BackgroundProcessorJobStore {
  private jobs = new Map<string, JobContext>();

  set(jobId: string, context: JobContext): void {
    this.jobs.set(jobId, context);
  }

  get(jobId: string): JobContext | undefined {
    return this.jobs.get(jobId);
  }

  has(jobId: string): boolean {
    return this.jobs.has(jobId);
  }

  delete(jobId: string): void {
    this.jobs.delete(jobId);
  }
}
