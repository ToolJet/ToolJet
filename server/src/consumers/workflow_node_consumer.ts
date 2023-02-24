import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('workflows')
export class WorkflowNodeConsumer {
  @Process('execute')
  async execute(job: Job<unknown>) {
    console.log({ data: job.data });
    return {};
  }
}
