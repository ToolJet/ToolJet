import { Repository, EntityRepository } from 'typeorm';
import { Thread } from '../entities/thread.entity';
import { CreateThreadDTO } from '../dto/create-thread.dto';

@EntityRepository(Thread)
export class ThreadRepository extends Repository<Thread> {
  public async createThread(createThreadDto: CreateThreadDTO): Promise<Thread> {
    const { x, y } = createThreadDto;

    const thread = new Thread();
    thread.x = x;
    thread.y = y;

    await thread.save();
    return thread;
  }

  public async editThread(createThreadDto: CreateThreadDTO, editedThread: Thread): Promise<Thread> {
    const { x, y } = createThreadDto;

    editedThread.x = x;
    editedThread.y = y;
    await editedThread.save();

    return editedThread;
  }
}
