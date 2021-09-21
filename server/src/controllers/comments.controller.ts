import { Controller, Get, Post, Body, Req, Res } from '@nestjs/common';
// import { CommentService } from '@services/comments.service';
import { Comment } from '../entities/comment.entity';

@Controller('comments')
export class CommentsController {
  constructor() {}
  @Get()
  getComments(@Req() req, @Res() res, err) {}

  @Post()
  createComment(@Res() res, @Body() comment: Comment) {
    // this.commentsService.create(comment);
    res.status(201).send('created');
  }
}
