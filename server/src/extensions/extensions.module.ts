import { Module } from '@nestjs/common';
import { ExtensionsService } from './extensions.service';
import { ExtensionsController } from './extensions.controller';

@Module({
  controllers: [ExtensionsController],
  providers: [ExtensionsService],
})
export class ExtensionsModule {}
