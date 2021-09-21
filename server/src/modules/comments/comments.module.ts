import { Module } from '@nestjs/common';
import { CommentsController } from '@controllers/comments.controller';
// import { AppConfigService } from '@services/app_config.service';

@Module({
  controllers: [CommentsController],
  imports: [],
  providers: [],
})
export class CommentsModule {}
