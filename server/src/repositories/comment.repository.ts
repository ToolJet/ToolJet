import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comment.dto';

@Injectable()
export class CommentRepository extends Repository<Comment> {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>
  ) {
    super(commentRepository.target, commentRepository.manager, commentRepository.queryRunner);
  }

  public async createComment(
    createCommentDto: CreateCommentDto,
    userId: string,
    organizationId: string
  ): Promise<Comment> {
    const { comment, threadId, appVersionsId } = createCommentDto;
    const _comment = this.commentRepository.create({
      comment,
      threadId,
      userId,
      organizationId,
      appVersionsId,
    });
    return this.commentRepository.save(_comment);
  }

  public async editComment(updateCommentDto: UpdateCommentDto, editedComment: Comment): Promise<Comment> {
    const { comment, threadId } = updateCommentDto;
    editedComment.comment = comment;
    editedComment.threadId = threadId;
    return this.commentRepository.save(editedComment);
  }
}
