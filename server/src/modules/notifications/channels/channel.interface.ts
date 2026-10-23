import { Notification } from '@entities/notification.entity';
import { NotificationRecipient } from '@entities/notification-recipient.entity';

export interface DeliverOptions {
  toast?: boolean; // live-arrival emphasis; realtime-only, never persisted
}

export interface NotificationChannel {
  key: string;
  deliver(event: Notification, recipient: NotificationRecipient, options?: DeliverOptions): Promise<void>;
}

export { NOTIFICATION_CHANNELS } from '../constants';
