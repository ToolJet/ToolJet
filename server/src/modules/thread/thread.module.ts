import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ThreadController } from '../../controllers/thread.controller';
import { ThreadService } from '../../services/thread.service';
import { ThreadRepository } from '../../repositories/thread.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ThreadRepository])],
  controllers: [ThreadController],
  providers: [ThreadService],
})
export class ThreadModule {}
