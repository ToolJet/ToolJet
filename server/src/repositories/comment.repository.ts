import { Repository, EntityRepository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDTO } from '../dto/create-comment.dto';

@EntityRepository(Comment)
export class CommentRepository extends Repository<Comment> {
  public async createComment(createCommentDto: CreateCommentDTO): Promise<Comment> {
    const { comment, tid } = createCommentDto;

    const _comment = new Comment();
    _comment.comment = comment;
    _comment.tid = tid;

    await _comment.save();
    return _comment;
  }

  public async editComment(createCommentDto: CreateCommentDTO, editedComment: Comment): Promise<Comment> {
    const { comment, tid } = createCommentDto;

    editedComment.comment = comment;
    editedComment.tid = tid;
    await editedComment.save();

    return editedComment;
  }
}
