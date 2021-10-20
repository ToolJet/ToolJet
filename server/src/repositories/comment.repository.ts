import { Repository, EntityRepository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDTO } from '../dto/create-comment.dto';

@EntityRepository(Comment)
export class CommentRepository extends Repository<Comment> {
  public async createComment(
    createCommentDto: CreateCommentDTO,
    userId: string,
    organizationId: string
  ): Promise<Comment> {
    const { comment, threadId, currentVersionId } = createCommentDto;

    const _comment = new Comment();
    _comment.comment = comment;
    _comment.threadId = threadId;
    _comment.userId = userId;
    _comment.organizationId = organizationId;
    _comment.currentVersionId = currentVersionId;

    await _comment.save();
    return _comment;
  }

  public async editComment(createCommentDto: CreateCommentDTO, editedComment: Comment): Promise<Comment> {
    const { comment, threadId } = createCommentDto;

    editedComment.comment = comment;
    editedComment.threadId = threadId;
    await editedComment.save();

    return editedComment;
  }
}
