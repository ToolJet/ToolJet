import { Controller, Request, Get, Post, Body, Param, Delete, UseGuards, Patch, Query, Req } from '@nestjs/common';
import { CommentService } from '@services/comment.service';
import { CreateCommentDTO } from '../dto/create-comment.dto';
import { Comment } from '../entities/comment.entity';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';

// createComment(): This method will be used to process a POST HTTP request sent from the client-side to create a new comment and persist it in the database.
// getComments(): This method will be responsible for fetching the entire list of comments from the database.
// getComment(): This method takes the commentId as a parameter and uses it to retrieve the details of the comment with that unique commentId from the database.
// editComment(): This method is used for editing the details of a particular comment.
// deleteComment(): This method also accepts the unique commentId to identify a particular comment and delete it from the database.

@Controller('comments')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  public async createComment(@Request() req, @Body() createCommentDto: CreateCommentDTO): Promise<Comment> {
    const comment = await this.commentService.createComment(createCommentDto, req.user.id, req.user.organization.id);
    return comment;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:commentId/all')
  public async getComments(@Param('commentId') commentId: string, @Query() query): Promise<Comment[]> {
    const comments = await this.commentService.getComments(commentId, query.currentVersionId);
    return comments;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:organizationId/all')
  public async getOrganizationThreads(
    @Param('organizationId') organizationId: string,
    @Query() query
  ): Promise<Comment[]> {
    const threads = await this.commentService.getOrganizationComments(organizationId, query.currentVersionId);
    return threads;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:appId/notifications')
  public async getNotifications(@Request() req, @Param('appId') appId: string, @Query() query): Promise<Comment[]> {
    const comments = await this.commentService.getNotifications(
      appId,
      req.user.id,
      query.isResolved,
      query.currentVersionId
    );
    return comments;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:commentId')
  public async getComment(@Param('commentId') commentId: number) {
    const comment = await this.commentService.getComment(commentId);
    return comment;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/edit/:commentId')
  public async editComment(
    @Body() createCommentDto: CreateCommentDTO,
    @Param('commentId') commentId: number
  ): Promise<Comment> {
    const comment = await this.commentService.editComment(commentId, createCommentDto);
    return comment;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete/:commentId')
  public async deleteComment(@Param('commentId') commentId: number) {
    const deletedComment = await this.commentService.deleteComment(commentId);
    return deletedComment;
  }
}
