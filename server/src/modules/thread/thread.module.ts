import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from '../casl/casl.module';

import { ThreadController } from '../../controllers/thread.controller';
import { ThreadService } from '../../services/thread.service';
import { ThreadRepository } from '../../repositories/thread.repository';
import { Thread } from 'src/entities/thread.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Thread]), CaslModule],
  controllers: [ThreadController],
  providers: [ThreadService, ThreadRepository],
})
export class ThreadModule {}
