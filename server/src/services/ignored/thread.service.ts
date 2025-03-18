import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Thread } from '../entities/thread.entity';
import { CreateThreadDto, UpdateThreadDto } from '../dto/thread.dto';
import { ThreadRepository } from '../repositories/thread.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class ThreadService {
  constructor(
    @InjectRepository(ThreadRepository)
    private threadRepository: ThreadRepository,
    private readonly _dataSource: DataSource
  ) {}

  public async createThread(createThreadDto: CreateThreadDto, userId: string, orgId: string): Promise<Thread> {
    const thread: Thread = await this.threadRepository.createThread(createThreadDto, userId, orgId);
    return (await this.getThreads(thread.appId, thread.organizationId, thread.appVersionsId, thread.id))?.[0];
  }

  public async getThreads(
    appId: string,
    organizationId: string,
    appVersionsId: string,
    threadId?: string
  ): Promise<Thread[]> {
    const query = this._dataSource
      .createQueryBuilder(Thread, 'thread')
      .innerJoin('thread.user', 'user')
      .addSelect(['user.id', 'user.firstName', 'user.lastName'])
      .andWhere('thread.appId = :appId', {
        appId,
      })
      .andWhere('thread.organizationId = :organizationId', {
        organizationId,
      })
      .andWhere('thread.appVersionsId = :appVersionsId', {
        appVersionsId,
      });

    if (threadId) {
      query.andWhere('thread.id = :threadId', {
        threadId,
      });
    }
    return await query.getMany();
  }

  public async getOrganizationThreads(organizationId: string): Promise<Thread[]> {
    return await this.threadRepository.find({
      where: {
        organizationId,
      },
    });
  }

  public async getThread(threadId: string): Promise<Thread> {
    const foundThread = await this.threadRepository.findOne({ where: { id: threadId } });
    if (!foundThread) {
      throw new NotFoundException('Thread not found');
    }
    return foundThread;
  }

  public async editThread(threadId: string, updateThreadDto: UpdateThreadDto): Promise<Thread> {
    const editedThread = await this.threadRepository.findOne({ where: { id: threadId } });
    if (!editedThread) {
      throw new NotFoundException('Thread not found');
    }
    return this.threadRepository.editThread(updateThreadDto, editedThread);
  }

  public async deleteThread(threadId: string): Promise<void> {
    await this.threadRepository.delete(threadId);
  }
}
