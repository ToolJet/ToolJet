import { NotificationListItem } from '../types';
import { ListNotificationsQueryDto } from '../dto';

export interface INotificationController {
  list(user: any, query: ListNotificationsQueryDto): Promise<{ notifications: NotificationListItem[] }>;
  unreadCount(user: any): Promise<{ count: number }>;
  markRead(user: any, recipientId: string): Promise<{ success: boolean }>;
  markAllRead(user: any): Promise<{ success: boolean }>;
  clearRead(user: any): Promise<{ success: boolean; cleared: number }>;
}
