import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Notification } from '@entities/notification.entity';
import { NotificationRecipient } from '@entities/notification-recipient.entity';

export interface PersistedNotification {
  notification: Notification;
  recipient: NotificationRecipient;
}

@Injectable()
export class NotificationRepository extends Repository<Notification> {
  constructor(private dataSource: DataSource) {
    super(Notification, dataSource.createEntityManager());
  }

  // dedupeKey is folded into metadata before save so the jsonb query stays consistent with the stored row
  async createForUser(params: {
    organizationId: string;
    userId: string;
    type: string;
    title: string;
    body?: string;
    link?: string;
    metadata?: Record<string, unknown>;
    dedupeKey?: string;
  }): Promise<PersistedNotification | null> {
    return this.manager.transaction(async (em) => {
      if (params.dedupeKey) {
        const exists = await em
          .createQueryBuilder(Notification, 'n')
          .where(`n.metadata ->> 'dedupeKey' = :key`, { key: params.dedupeKey })
          .andWhere('n.organization_id = :org', { org: params.organizationId })
          .getExists();
        if (exists) return null;
      }

      // merge dedupeKey into metadata so existence check matches on re-fire
      const metadata = params.dedupeKey
        ? { ...(params.metadata ?? {}), dedupeKey: params.dedupeKey }
        : (params.metadata ?? null);

      const notification = await em.save(
        em.create(Notification, {
          organizationId: params.organizationId,
          type: params.type,
          title: params.title,
          body: params.body ?? null,
          link: params.link ?? null,
          metadata,
        })
      );
      const recipient = await em.save(
        em.create(NotificationRecipient, {
          notificationId: notification.id,
          userId: params.userId,
          readAt: null,
        })
      );
      return { notification, recipient };
    });
  }

  async listForUser(userId: string, opts: { status: 'unread' | 'all'; limit: number; before?: Date }) {
    const qb = this.manager
      .createQueryBuilder(NotificationRecipient, 'r')
      .innerJoinAndMapOne('r.notification', Notification, 'n', 'n.id = r.notification_id')
      .where('r.user_id = :userId', { userId })
      .orderBy('n.created_at', 'DESC')
      .limit(opts.limit);
    if (opts.status === 'unread') qb.andWhere('r.read_at IS NULL');
    if (opts.before) qb.andWhere('n.created_at < :before', { before: opts.before });
    return qb.getMany();
  }

  async unreadCount(userId: string): Promise<number> {
    return this.manager.count(NotificationRecipient, { where: { userId, readAt: null } });
  }

  // org+user scoped: only marks rows owned by this user
  async markRead(recipientId: string, userId: string): Promise<void> {
    await this.manager
      .createQueryBuilder()
      .update(NotificationRecipient)
      .set({ readAt: () => 'now()' })
      .where('id = :recipientId AND user_id = :userId AND read_at IS NULL', { recipientId, userId })
      .execute();
  }

  async markAllRead(userId: string): Promise<void> {
    await this.manager
      .createQueryBuilder()
      .update(NotificationRecipient)
      .set({ readAt: () => 'now()' })
      .where('user_id = :userId AND read_at IS NULL', { userId })
      .execute();
  }
}
