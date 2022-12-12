import { Repository, EntityRepository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comment.dto';

@EntityRepository(Comment)
export class CommentRepository extends Repository<Comment> {
  public async createComment(
    createCommentDto: CreateCommentDto,
    userId: string,
    organizationId: string
  ): Promise<Comment> {
    const { comment, threadId, appVersionsId } = createCommentDto;

    const _comment = new Comment();
    _comment.comment = comment;
    _comment.threadId = threadId;
    _comment.userId = userId;
    _comment.organizationId = organizationId;
    _comment.appVersionsId = appVersionsId;

    await _comment.save();
    return _comment;
  }

  public async editComment(updateCommentDto: UpdateCommentDto, editedComment: Comment): Promise<Comment> {
    const { comment, threadId } = updateCommentDto;

    editedComment.comment = comment;
    editedComment.threadId = threadId;
    await editedComment.save();

    return editedComment;
  }
}
