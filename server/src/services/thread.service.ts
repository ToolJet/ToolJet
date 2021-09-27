import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Thread } from '../entities/thread.entity';
import { CreateThreadDTO } from '../dto/create-thread.dto';
import { ThreadRepository } from '../repositories/thread.repository';

@Injectable()
export class ThreadService {
  constructor(
    @InjectRepository(ThreadRepository)
    private threadRepository: ThreadRepository
  ) {}

  public async createThread(createThreadDto: CreateThreadDTO): Promise<Thread> {
    return await this.threadRepository.createThread(createThreadDto);
  }

  public async getThreads(): Promise<Thread[]> {
    return await this.threadRepository.find();
  }

  public async getThread(threadId: number): Promise<Thread> {
    const foundThread = await this.threadRepository.findOne(threadId);
    if (!foundThread) {
      throw new NotFoundException('Thread not found');
    }
    return foundThread;
  }

  public async editThread(threadId: number, createThreadDto: CreateThreadDTO): Promise<Thread> {
    const editedThread = await this.threadRepository.findOne(threadId);
    if (!editedThread) {
      throw new NotFoundException('Thread not found');
    }
    return this.threadRepository.editThread(createThreadDto, editedThread);
  }

  public async deleteThread(threadId: number): Promise<void> {
    await this.threadRepository.delete(threadId);
  }
}
