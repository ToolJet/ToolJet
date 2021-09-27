import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentController } from '@controllers/comment.controller';
import { CommentService } from '@services/comment.service';
import { CommentRepository } from '../../repositories/comment.repository';

@Module({
  controllers: [CommentController],
  imports: [TypeOrmModule.forFeature([CommentRepository])],
  providers: [CommentService],
})
export class CommentModule {}
