import { Controller, Get, Post, Body, Req, Param, Delete, UseGuards, Patch } from '@nestjs/common';
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

  @Get('all')
  public async getComments(): Promise<Comment[]> {
    const comments = await this.commentService.getComments();
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

  // @Post('/create')
  // public async create(@Body() body): Promise<Comment> {
  //   const comment = await this.commentService.create(body);
  //   return comment;
  // }

  // // @UseGuards(JwtAuthGuard)
  // @Get('/positions')
  // getPositions(@Req() req, @Param() params) {
  //   // const app = await this.commentService.find(params.id);
  //   return { id1: { x: 23, y: 24 }, id2: { x: 23, y: 65 }, id3: { x: 1250, y: 65 } };
  // }

  // // @UseGuards(JwtAuthGuard)
  // @Patch('/positions/:commentId')
  // async update(@Body() body, @Param('commentId') commentId: number): Promise<Comment> {
  //   const { x, y } = body;
  //   const comment = await this.commentService.update(commentId, { x, y });
  //   return comment;
  // }

  // // @UseGuards(JwtAuthGuard)
  // @Get(':id')
  // async getComments(@Req() req, @Param() params) {
  //   // const app = await this.commentService.find(params.id);
  //   return [
  //     { comment, created_at: '2021-09-04T10:59:38.779Z' },
  //     { comment, created_at: '2021-09-04T10:59:38.779Z' },
  //   ];
  // }

  // // @UseGuards(JwtAuthGuard)
  // @Patch(':id')
  // async updateComment(@Body() body, @Param('commentId') commentId: number): Promise<Comment> {
  //   const { comment } = body;
  //   const updatedComment = await this.commentService.update(commentId, { comment });
  //   return updatedComment;
  // }
}
