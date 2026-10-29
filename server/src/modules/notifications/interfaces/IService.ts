import { NotifyParams, NotificationListItem } from '../types';

export interface INotificationService {
  notify(params: NotifyParams): Promise<void>;
  list(
    userId: string,
    organizationId: string,
    status: 'unread' | 'all',
    limit: number,
    before?: Date
  ): Promise<NotificationListItem[]>;
  unreadCount(userId: string, organizationId: string): Promise<number>;
  markRead(recipientId: string, userId: string): Promise<void>;
  remove(recipientId: string, userId: string): Promise<boolean>;
  markAllRead(userId: string, organizationId: string): Promise<void>;
  clearRead(userId: string, organizationId: string): Promise<number>;
}
