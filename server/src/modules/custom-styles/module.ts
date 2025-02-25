import { Module } from '@nestjs/common';
import { CustomStylesController } from '@modules/custom-styles/controller';
import { CustomStylesService } from '@modules/custom-styles/service';

@Module({
  imports: [],
  providers: [CustomStylesService],
  controllers: [CustomStylesController],
  exports: [],
})
export class CustomStylesModule {}
