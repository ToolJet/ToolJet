import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from './repository';
import { NotificationChannel } from './channels/channel.interface';
import { NOTIFICATION_CHANNELS, DEFAULT_CHANNELS } from './constants';
import { INotificationService } from './interfaces/IService';
import { NotifyParams, NotificationListItem } from './types';

@Injectable()
export class NotificationService implements INotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly repository: NotificationRepository,
    @Inject(NOTIFICATION_CHANNELS) private readonly channels: NotificationChannel[]
  ) {}

  async notify(params: NotifyParams): Promise<void> {
    const persisted = await this.repository.createForUser({
      organizationId: params.organizationId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
      metadata: params.metadata,
      dedupeKey: params.dedupeKey,
    });
    if (!persisted) return; // duplicate — skip dispatch

    const enabled = params.channels ?? DEFAULT_CHANNELS;
    for (const channel of this.channels) {
      if (!enabled.includes(channel.key)) continue;
      // one channel failure must not block the others
      await channel
        .deliver(persisted.notification, persisted.recipient, { toast: params.toast })
        .catch((e) => this.logger.error(`channel ${channel.key} failed: ${e?.message}`));
    }
  }

  async list(userId: string, status: 'unread' | 'all', limit: number, before?: Date): Promise<NotificationListItem[]> {
    const rows = await this.repository.listForUser(userId, { status, limit, before });
    return rows.map((r: any) => ({
      recipientId: r.id,
      id: r.notification.id,
      type: r.notification.type,
      title: r.notification.title,
      body: r.notification.body,
      link: r.notification.link,
      metadata: r.notification.metadata,
      readAt: r.readAt,
      createdAt: r.notification.createdAt,
    }));
  }

  unreadCount(userId: string) {
    return this.repository.unreadCount(userId);
  }

  markRead(recipientId: string, userId: string) {
    return this.repository.markRead(recipientId, userId);
  }

  markAllRead(userId: string) {
    return this.repository.markAllRead(userId);
  }

  clearRead(userId: string) {
    return this.repository.clearReadForUser(userId);
  }
}
