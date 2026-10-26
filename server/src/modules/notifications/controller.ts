import { Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { User } from '@modules/app/decorators/user.decorator';
import { NotificationService } from './service';
import { ListNotificationsQueryDto } from './dto';
import { INotificationController } from './interfaces/IController';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController implements INotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(@User() user, @Query() query: ListNotificationsQueryDto) {
    const notifications = await this.notificationService.list(
      user.id,
      user.organizationId,
      query.status ?? 'all',
      query.limit ?? 20,
      query.before ? new Date(query.before) : undefined
    );
    return { notifications };
  }

  @Get('unread-count')
  async unreadCount(@User() user) {
    return { count: await this.notificationService.unreadCount(user.id, user.organizationId) };
  }

  @Patch(':recipientId/read')
  async markRead(@User() user, @Param('recipientId') recipientId: string) {
    await this.notificationService.markRead(recipientId, user.id);
    return { success: true };
  }

  @Patch('read-all')
  async markAllRead(@User() user) {
    await this.notificationService.markAllRead(user.id, user.organizationId);
    return { success: true };
  }

  @Delete('read')
  async clearRead(@User() user) {
    const cleared = await this.notificationService.clearRead(user.id, user.organizationId);
    return { success: true, cleared };
  }

  // must stay below @Delete('read') — param route would swallow it
  @Delete(':recipientId')
  async remove(@User() user, @Param('recipientId') recipientId: string) {
    const removed = await this.notificationService.remove(recipientId, user.id);
    return { success: removed };
  }
}
