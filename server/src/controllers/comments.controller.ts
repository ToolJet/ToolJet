import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Param,
  UseGuards,
} from '@nestjs/common';
// import { CommentService } from '@services/comments.service';
import { Comment } from '../entities/comment.entity';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';

const comment = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aperiam deleniti fugit incidunt, iste, itaque minima neque pariatur perferendis sed suscipit velit vitae voluptatem.'

@Controller('comments')
export class CommentsController {
  constructor() { }
  // @UseGuards(JwtAuthGuard)
  // @Get()
  // getComments(@Req() req, @Res() res, err) {
  //   res.status(200).send([]);
  // }

  // @UseGuards(JwtAuthGuard)
  @Get('/positions')
  getPositions(@Req() req, @Param() params) {
    // const app = await this.commentsService.find(params.id);
    return { id1: { x: 23, y: 24 }, id2: { x: 23, y: 65 }, id3: { x: 1250, y: 65 } };
  }

  // @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getComments(@Req() req, @Param() params) {
    // const app = await this.commentsService.find(params.id);
    return [{ comment, created_at: '2021-09-04T10:59:38.779Z' }]
  }

  // @UseGuards(JwtAuthGuard)
  // @Post()
  // createComment(@Res() res, @Body() comment: Comment) {
  //   // this.commentsService.create(comment);
  //   res.status(201).send('created');
  // }
}
