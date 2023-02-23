import { OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('workflows')
export class WorkflowNodeConsumer {
  @Process('execute')
  async execute(job: Job<unknown>) {
    console.log({ data: job.data });
    return {};
  }

  @OnQueueActive()
  onActive(job: Job) {
    console.log(`Processing job ${job.id} of type ${job.name} with data ${job.data}...`);
  }
}
