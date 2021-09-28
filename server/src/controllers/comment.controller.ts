import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch } from '@nestjs/common';
import { CommentService } from '@services/comment.service';
import { CreateCommentDTO } from '../dto/create-comment.dto';
import { Comment } from '../entities/comment.entity';
// import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';

// createComment(): This method will be used to process a POST HTTP request sent from the client-side to create a new comment and persist it in the database.
// getComments(): This method will be responsible for fetching the entire list of comments from the database.
// getComment(): This method takes the commentId as a parameter and uses it to retrieve the details of the comment with that unique commentId from the database.
// editComment(): This method is used for editing the details of a particular comment.
// deleteComment(): This method also accepts the unique commentId to identify a particular comment and delete it from the database.

@Controller('comment')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Post('create')
  public async createComment(@Body() createCommentDto: CreateCommentDTO): Promise<Comment> {
    const comment = await this.commentService.createComment(createCommentDto);
    return comment;
  }

  @Get('/:tid/all')
  public async getComments(@Param('tid') tid: string): Promise<Comment[]> {
    const comments = await this.commentService.getComments(tid);
    return comments;
  }

  @Get('/:commentId')
  public async getComment(@Param('commentId') commentId: number) {
    const comment = await this.commentService.getComment(commentId);
    return comment;
  }

  @Patch('/edit/:commentId')
  public async editComment(
    @Body() createCommentDto: CreateCommentDTO,
    @Param('commentId') commentId: number
  ): Promise<Comment> {
    const comment = await this.commentService.editComment(commentId, createCommentDto);
    return comment;
  }

  @Delete('/delete/:commentId')
  public async deleteComment(@Param('commentId') commentId: number) {
    const deletedComment = await this.commentService.deleteComment(commentId);
    return deletedComment;
  }
}
