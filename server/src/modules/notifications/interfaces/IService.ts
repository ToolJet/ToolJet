import { NotifyParams, NotificationListItem } from '../types';

export interface INotificationService {
  notify(params: NotifyParams): Promise<void>;
  list(userId: string, status: 'unread' | 'all', limit: number, before?: Date): Promise<NotificationListItem[]>;
  unreadCount(userId: string): Promise<number>;
  markRead(recipientId: string, userId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
}
