import { Thread } from '@entities/thread.entity';

export class ThreadRepository {
  async createThread(data: Partial<Thread>, _userId: string, _organizationId: string) {
    return Thread.save(Thread.create(data));
  }
}
