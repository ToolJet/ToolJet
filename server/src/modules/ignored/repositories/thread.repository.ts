import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateThreadDto, UpdateThreadDto } from '@dto/thread.dto';
import { Thread } from '@entities/thread.entity';

@Injectable()
export class ThreadRepository extends Repository<Thread> {
  constructor(
    @InjectRepository(Thread)
    private threadRepository: Repository<Thread>
  ) {
    super(threadRepository.target, threadRepository.manager, threadRepository.queryRunner);
  }

  public async createThread(createThreadDto: CreateThreadDto, userId: string, organizationId: string): Promise<Thread> {
    const { x, y, appId, appVersionsId, pageId } = createThreadDto;

    const thread = this.threadRepository.create({
      x,
      y,
      appId,
      userId,
      organizationId,
      appVersionsId,
      pageId,
    });

    return await this.threadRepository.save(thread);
  }

  public async editThread(updateThreadDto: UpdateThreadDto, editedThread: Thread): Promise<Thread> {
    const { x, y, isResolved } = updateThreadDto;

    editedThread.x = x;
    editedThread.y = y;
    editedThread.isResolved = isResolved;

    return await this.threadRepository.save(editedThread);
  }
}
