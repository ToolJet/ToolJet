import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ThreadService } from '../services/thread.service';
import { CreateThreadDto, UpdateThreadDto } from '../dto/thread.dto';
import { Thread } from '../entities/thread.entity';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { ThreadsAbilityFactory } from 'src/modules/casl/abilities/threads-ability.factory';
import { User } from 'src/decorators/user.decorator';

@Controller('threads')
export class ThreadController {
  constructor(private threadService: ThreadService, private threadsAbilityFactory: ThreadsAbilityFactory) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  public async createThread(@User() user, @Body() createThreadDto: CreateThreadDto): Promise<Thread> {
    const ability = await this.threadsAbilityFactory.appsActions(user, createThreadDto.appId);

    if (!ability.can('createThread', Thread)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const thread = await this.threadService.createThread(createThreadDto, user.id, user.organizationId);
    return thread;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:appId/all')
  public async getThreads(@User() user, @Param('appId') appId: string, @Query() query): Promise<Thread[]> {
    const ability = await this.threadsAbilityFactory.appsActions(user, appId);

    if (!ability.can('fetchThreads', Thread)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const threads = await this.threadService.getThreads(appId, user.organizationId, query.appVersionsId);
    return threads;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:threadId')
  public async getThread(@Param('threadId') threadId: number, @User() user) {
    const _response = await Thread.findOne({
      where: { id: threadId },
    });

    const ability = await this.threadsAbilityFactory.appsActions(user, _response.appId);

    if (!ability.can('fetchThreads', Thread)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const thread = await this.threadService.getThread(threadId);
    return thread;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:threadId')
  public async editThread(
    @Body() updateThreadDto: UpdateThreadDto,
    @Param('threadId') threadId: string,
    @User() user
  ): Promise<Thread> {
    const _response = await Thread.findOne({
      where: { id: threadId },
    });

    const ability = await this.threadsAbilityFactory.appsActions(user, _response.appId);

    if (!ability.can('updateThread', Thread)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const thread = await this.threadService.editThread(threadId, updateThreadDto);
    return thread;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:threadId')
  public async deleteThread(@Param('threadId') threadId: string, @User() user) {
    const _response = await Thread.findOne({
      where: { id: threadId },
    });

    const ability = await this.threadsAbilityFactory.appsActions(user, _response.appId);

    if (!ability.can('deleteThread', Thread)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const deletedThread = await this.threadService.deleteThread(threadId);
    return deletedThread;
  }
}
