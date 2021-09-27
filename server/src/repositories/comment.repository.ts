import { Repository, EntityRepository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDTO } from '../dto/create-comment.dto';

@EntityRepository(Comment)
export class CommentRepository extends Repository<Comment> {
  public async createComment(createCommentDto: CreateCommentDTO): Promise<Comment> {
    const { comment, x, y } = createCommentDto;

    const _comment = new Comment();
    _comment.comment = comment;
    _comment.x = x;
    _comment.y = y;

    await _comment.save();
    return _comment;
  }

  public async editComment(createCommentDto: CreateCommentDTO, editedComment: Comment): Promise<Comment> {
    const { comment, x, y } = createCommentDto;

    editedComment.comment = comment;
    editedComment.x = x;
    editedComment.y = y;
    await editedComment.save();

    return editedComment;
  }
}
