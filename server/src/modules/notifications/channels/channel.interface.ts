import { Notification } from '@entities/notification.entity';
import { NotificationRecipient } from '@entities/notification-recipient.entity';

export interface NotificationChannel {
  key: string;
  deliver(event: Notification, recipient: NotificationRecipient): Promise<void>;
}

export { NOTIFICATION_CHANNELS } from '../constants';
