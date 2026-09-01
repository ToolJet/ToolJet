import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '@entities/notification.entity';
import { NotificationRecipient } from '@entities/notification-recipient.entity';
import { NotificationChannel, DeliverOptions } from './channel.interface';
import { CHANNEL_KEYS, NOTIFICATION_REALTIME_CHANNEL } from '../constants';
import { RedisService } from '@modules/redis/service';

// In-app delivery = persist (already done before deliver runs) + publish to Redis so the
// ws gateway on whichever web pod holds the user's socket can push it live. Producer and
// socket live on different pods (worker vs web), so the hop goes through Redis pub/sub.
@Injectable()
export class InAppChannel implements NotificationChannel {
  key = CHANNEL_KEYS.IN_APP;
  private readonly logger = new Logger(InAppChannel.name);

  constructor(private readonly redisService: RedisService) {}

  async deliver(event: Notification, recipient: NotificationRecipient, options?: DeliverOptions): Promise<void> {
    const message = JSON.stringify({
      userId: recipient.userId,
      toast: options?.toast === true,
      notification: {
        recipientId: recipient.id,
        id: event.id,
        organizationId: event.organizationId,
        type: event.type,
        title: event.title,
        body: event.body,
        link: event.link,
        metadata: event.metadata,
        readAt: null,
        createdAt: event.createdAt,
      },
    });
    await this.redisService.getClient().publish(NOTIFICATION_REALTIME_CHANNEL, message);
  }
}
