import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentController } from '@controllers/comment.controller';
import { CommentService } from '@services/comment.service';
import { CommentRepository } from '../../repositories/comment.repository';
import { CaslModule } from '../casl/casl.module';

@Module({
  controllers: [CommentController],
  imports: [TypeOrmModule.forFeature([CommentRepository]), CaslModule],
  providers: [CommentService],
})
export class CommentModule {}
