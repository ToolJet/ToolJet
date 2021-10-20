import { Repository, EntityRepository } from 'typeorm';
import { Thread } from '../entities/thread.entity';
import { CreateThreadDTO } from '../dto/create-thread.dto';

@EntityRepository(Thread)
export class ThreadRepository extends Repository<Thread> {
  public async createThread(createThreadDto: CreateThreadDTO, userId: string, organizationId: string): Promise<Thread> {
    const { x, y, appId, currentVersionId } = createThreadDto;

    const thread = new Thread();
    thread.x = x;
    thread.y = y;
    thread.appId = appId;
    thread.userId = userId;
    thread.organizationId = organizationId;
    thread.currentVersionId = currentVersionId;

    const response = await thread.save();
    const _response = await Thread.findOne({
      where: { id: response.id },
      relations: ['user'],
    });
    return _response;
  }

  public async editThread(createThreadDto: CreateThreadDTO, editedThread: Thread): Promise<Thread> {
    const { x, y, isResolved } = createThreadDto;

    editedThread.x = x;
    editedThread.y = y;
    editedThread.isResolved = isResolved;
    await editedThread.save();

    return editedThread;
  }
}
