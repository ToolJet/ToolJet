import { Repository, EntityRepository } from 'typeorm';
import { Thread } from '../entities/thread.entity';
import { CreateThreadDto, UpdateThreadDto } from '../dto/thread.dto';

@EntityRepository(Thread)
export class ThreadRepository extends Repository<Thread> {
  public async createThread(createThreadDto: CreateThreadDto, userId: string, organizationId: string): Promise<Thread> {
    const { x, y, appId, appVersionsId } = createThreadDto;

    const thread = new Thread();
    thread.x = x;
    thread.y = y;
    thread.appId = appId;
    thread.userId = userId;
    thread.organizationId = organizationId;
    thread.appVersionsId = appVersionsId;

    const response = await thread.save();
    const _response = await Thread.findOne({
      where: { id: response.id },
      relations: ['user'],
    });
    return _response;
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
