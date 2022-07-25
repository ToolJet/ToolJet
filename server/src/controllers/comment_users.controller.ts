import { Controller, Get, Body, Param, UseGuards, Patch, Query } from '@nestjs/common';
import { CommentUsersService } from '@services/comment_users.service';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { UpdateCommentUserDto } from '@dto/comment-user.dto';

@Controller('comment_notifications')
export class CommentUsersController {
  constructor(private commentUsersService: CommentUsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  public async index(@User() user, @Query() query) {
    const notifications = await this.commentUsersService.findAll(user.id, query.isRead);
    return notifications;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  public async update(@Param('id') id: string, @Body() body: UpdateCommentUserDto) {
    const notification = await this.commentUsersService.update(id, body);
    return notification;
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  public async updateAll(@User() user, @Body() body: UpdateCommentUserDto) {
    const notifications = await this.commentUsersService.updateAll(user.id, body);
    return notifications;
  }
}
