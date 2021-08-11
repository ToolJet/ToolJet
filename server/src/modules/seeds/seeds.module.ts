import { Module } from '@nestjs/common';
import { SeedsService } from '../../services/seeds.service';

@Module({
  providers: [SeedsService],
  exports: [SeedsService],
})
export class SeedsModule {}
