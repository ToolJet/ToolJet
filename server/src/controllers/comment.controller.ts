import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { CommentService } from '@services/comment.service';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { Comment } from '../entities/comment.entity';
import { Thread } from '../entities/thread.entity';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { CommentsAbilityFactory } from 'src/modules/casl/abilities/comments-ability.factory';
import { User } from 'src/decorators/user.decorator';

@Controller('comments')
export class CommentController {
  constructor(private commentService: CommentService, private commentsAbilityFactory: CommentsAbilityFactory) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  public async createComment(@User() user, @Body() createCommentDto: CreateCommentDto): Promise<Comment> {
    const _response = await Thread.findOne({
      where: { id: createCommentDto.threadId },
    });
    const ability = await this.commentsAbilityFactory.appsActions(user, { id: _response.appId });

    if (!ability.can('createComment', Comment)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const comment = await this.commentService.createComment(createCommentDto, user);
    return comment;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:threadId/all')
  public async getComments(@User() user, @Param('threadId') threadId: string, @Query() query): Promise<Comment[]> {
    const _response = await Thread.findOne({
      where: { id: threadId },
    });
    const ability = await this.commentsAbilityFactory.appsActions(user, { id: _response.appId });

    if (!ability.can('fetchComments', Comment)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const comments = await this.commentService.getComments(threadId, query.appVersionsId);
    return comments;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:appId/notifications')
  public async getNotifications(@User() user, @Param('appId') appId: string, @Query() query): Promise<Comment[]> {
    const ability = await this.commentsAbilityFactory.appsActions(user, { id: appId });

    if (!ability.can('fetchComments', Comment)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const comments = await this.commentService.getNotifications(
      appId,
      user.id,
      query.isResolved,
      query.appVersionsId,
      query.pageId
    );
    return comments;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:commentId')
  public async getComment(@Param('commentId') commentId: string) {
    const comment = await this.commentService.getComment(commentId);
    return comment;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:commentId')
  public async editComment(
    @User() user,
    @Body() updateCommentDto: UpdateCommentDto,
    @Param('commentId') commentId: string
  ): Promise<Comment> {
    const _response = await Comment.findOne({
      where: { id: commentId },
      relations: ['thread'],
    });
    const ability = await this.commentsAbilityFactory.appsActions(user, { id: _response.thread.appId });

    if (!ability.can('updateComment', Comment)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const comment = await this.commentService.editComment(commentId, updateCommentDto);
    return comment;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:commentId')
  public async deleteComment(@User() user, @Param('commentId') commentId: string) {
    const _response = await Comment.findOne({
      where: { id: commentId },
      relations: ['thread'],
    });
    const ability = await this.commentsAbilityFactory.appsActions(user, { id: _response.thread.appId });

    if (!ability.can('deleteComment', Comment)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const deletedComment = await this.commentService.deleteComment(commentId);
    return deletedComment;
  }
}
