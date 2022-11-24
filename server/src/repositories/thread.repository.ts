import { Repository, EntityRepository } from 'typeorm';
import { Thread } from '../entities/thread.entity';
import { CreateThreadDto, UpdateThreadDto } from '../dto/thread.dto';

@EntityRepository(Thread)
export class ThreadRepository extends Repository<Thread> {
  public async createThread(createThreadDto: CreateThreadDto, userId: string, organizationId: string): Promise<Thread> {
    const { x, y, appId, appVersionsId, pageId } = createThreadDto;

    const thread = new Thread();
    thread.x = x;
    thread.y = y;
    thread.appId = appId;
    thread.userId = userId;
    thread.organizationId = organizationId;
    thread.appVersionsId = appVersionsId;
    thread.pageId = pageId;

    return await thread.save();
  }

  public async editThread(updateThreadDto: UpdateThreadDto, editedThread: Thread): Promise<Thread> {
    const { x, y, isResolved } = updateThreadDto;

    editedThread.x = x;
    editedThread.y = y;
    editedThread.isResolved = isResolved;
    await editedThread.save();

    return editedThread;
  }
}
