import { Controller, Post, Body, Get, Patch, Param, Delete } from '@nestjs/common';
import { ThreadService } from '../services/thread.service';
import { CreateThreadDTO } from '../dto/create-thread.dto';
import { Thread } from '../entities/thread.entity';

@Controller('thread')
export class ThreadController {
  constructor(private threadService: ThreadService) {}

  @Post('create')
  public async createThread(@Body() createThreadDto: CreateThreadDTO): Promise<Thread> {
    const thread = await this.threadService.createThread(createThreadDto);
    return thread;
  }

  @Get('all')
  public async getThreads(): Promise<Thread[]> {
    const threads = await this.threadService.getThreads();
    return threads;
  }

  @Get('/:threadId')
  public async getThread(@Param('threadId') threadId: number) {
    const thread = await this.threadService.getThread(threadId);
    return thread;
  }

  @Patch('/edit/:threadId')
  public async editThread(
    @Body() createThreadDto: CreateThreadDTO,
    @Param('threadId') threadId: number
  ): Promise<Thread> {
    const thread = await this.threadService.editThread(threadId, createThreadDto);
    return thread;
  }

  @Delete('/delete/:threadId')
  public async deleteThread(@Param('threadId') threadId: number) {
    const deletedThread = await this.threadService.deleteThread(threadId);
    return deletedThread;
  }
}
