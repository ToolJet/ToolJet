import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
// import { CommentService } from '@services/comments.service';
import { Comment } from '../entities/comment.entity';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';

@Controller('comments')
export class CommentsController {
  constructor() {}
  @UseGuards(JwtAuthGuard)
  @Get()
  getComments(@Req() req, @Res() res, err) {
    res.status(200).send([]);
  }

  // @UseGuards(JwtAuthGuard)
  @Get('/positions')
  getPositions(@Req() req, @Res() res, err) {
    res.status(200).send([{ id1: { x: 23, y: 24 }, id2: { x: 23, y: 24 } }]);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createComment(@Res() res, @Body() comment: Comment) {
    // this.commentsService.create(comment);
    res.status(201).send('created');
  }
}
