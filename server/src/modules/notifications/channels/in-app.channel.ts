import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '@entities/notification.entity';
import { NotificationRecipient } from '@entities/notification-recipient.entity';
import { NotificationChannel } from './channel.interface';
import { CHANNEL_KEYS } from '../constants';

// P1: persist-only. Row already saved before deliver() runs; socket emit lands in P2.
@Injectable()
export class InAppChannel implements NotificationChannel {
  key = CHANNEL_KEYS.IN_APP;
  private readonly logger = new Logger(InAppChannel.name);

  async deliver(event: Notification, recipient: NotificationRecipient): Promise<void> {
    this.logger.debug(`in_app notification ${event.id} persisted for recipient ${recipient.id}`);
  }
}
