import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('workflows')
export class WorkflowNodeConsumer {
  @Process()
  async execute(job: Job<unknown>) {
    console.log({ job });
    return {};
  }
}
