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

  /**
   * Creates a single notification with recipients for multiple users (fan-out).
   * DedupeKey is checked at the Notification level — if the notification already exists,
   * new recipients are still created for users who don't already have one.
   */
  async createForUsers(params: {
    organizationId: string;
    userIds: string[];
    type: string;
    title: string;
    body?: string;
    link?: string;
    metadata?: Record<string, unknown>;
    dedupeKey?: string;
  }): Promise<{ notification: Notification; recipients: NotificationRecipient[] } | null> {
    // Deduplicate to prevent creating multiple recipients for the same user
    const uniqueUserIds = [...new Set(params.userIds)];
    if (!uniqueUserIds.length) return null;

    return this.manager.transaction(async (em) => {
      const metadata = params.dedupeKey
        ? { ...(params.metadata ?? {}), dedupeKey: params.dedupeKey }
        : (params.metadata ?? null);

      let notification: Notification;

      if (params.dedupeKey) {
        // Try to find existing notification with this dedupeKey
        const existing = await em
          .createQueryBuilder(Notification, 'n')
          .where(`n.metadata ->> 'dedupeKey' = :key`, { key: params.dedupeKey })
          .andWhere('n.organization_id = :org', { org: params.organizationId })
          .getOne();

        if (existing) {
          notification = existing;
        } else {
          notification = await em.save(
            em.create(Notification, {
              organizationId: params.organizationId,
              type: params.type,
              title: params.title,
              body: params.body ?? null,
              link: params.link ?? null,
              metadata,
            })
          );
        }
      } else {
        notification = await em.save(
          em.create(Notification, {
            organizationId: params.organizationId,
            type: params.type,
            title: params.title,
            body: params.body ?? null,
            link: params.link ?? null,
            metadata,
          })
        );
      }

      // Create recipients for users who don't already have one for this notification
      const existingRecipients = await em
        .createQueryBuilder(NotificationRecipient, 'r')
        .where('r.notification_id = :nid', { nid: notification.id })
        .andWhere('r.user_id IN (:...userIds)', { userIds: uniqueUserIds })
        .getMany();

      const existingUserIds = new Set(existingRecipients.map((r) => r.userId));
      const newUserIds = uniqueUserIds.filter((uid) => !existingUserIds.has(uid));

      if (!newUserIds.length) return null; // all users already have this notification

      const recipients = await Promise.all(
        newUserIds.map((userId) =>
          em.save(
            em.create(NotificationRecipient, {
              notificationId: notification.id,
              userId,
              readAt: null,
            })
          )
        )
      );

      return { notification, recipients };
    });
  }

  // reads are org-scoped: a multi-workspace user must not see org B's items in org A's panel
  async listForUser(
    userId: string,
    organizationId: string,
    opts: { status: 'unread' | 'all'; limit: number; before?: Date }
  ) {
    const qb = this.manager
      .createQueryBuilder(NotificationRecipient, 'r')
      .innerJoinAndMapOne('r.notification', Notification, 'n', 'n.id = r.notification_id')
      .where('r.user_id = :userId', { userId })
      .andWhere('n.organization_id = :organizationId', { organizationId })
      .orderBy('n.created_at', 'DESC')
      .limit(opts.limit);
    if (opts.status === 'unread') qb.andWhere('r.read_at IS NULL');
    if (opts.before) qb.andWhere('n.created_at < :before', { before: opts.before });
    return qb.getMany();
  }

  async unreadCount(userId: string, organizationId: string): Promise<number> {
    const [{ c }] = await this.manager.query(
      `SELECT COUNT(*) AS c FROM notification_recipients r
         JOIN notifications n ON n.id = r.notification_id
        WHERE r.user_id = $1 AND n.organization_id = $2 AND r.read_at IS NULL`,
      [userId, organizationId]
    );
    return parseInt(c, 10);
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

  async markAllRead(userId: string, organizationId: string): Promise<void> {
    await this.manager.query(
      `UPDATE notification_recipients r SET read_at = now()
         FROM notifications n
        WHERE n.id = r.notification_id AND r.user_id = $1 AND n.organization_id = $2 AND r.read_at IS NULL`,
      [userId, organizationId]
    );
  }

  async removeForUser(recipientId: string, userId: string): Promise<boolean> {
    return this.manager.transaction(async (em) => {
      const [rows] = (await em.query(
        `DELETE FROM notification_recipients WHERE id = $1 AND user_id = $2 RETURNING notification_id`,
        [recipientId, userId]
      )) as [{ notification_id: string }[], number];
      if (rows.length === 0) return false;
      await em.query(
        `DELETE FROM notifications n WHERE n.id = $1 AND NOT EXISTS
           (SELECT 1 FROM notification_recipients r WHERE r.notification_id = n.id)`,
        [rows[0].notification_id]
      );
      return true;
    });
  }

  // clear-read: drop this user's READ recipients only; unread stay. Content rows
  // are deleted once no recipient references them (v1 is single-recipient, but
  // the guard keeps multi-recipient fan-out safe).
  async clearReadForUser(userId: string, organizationId: string): Promise<number> {
    return this.manager.transaction(async (em) => {
      // typeorm returns [rows, rowCount] for DELETE — destructure or ids map over the tuple
      const [rows] = (await em.query(
        `DELETE FROM notification_recipients r
          USING notifications n
          WHERE n.id = r.notification_id AND r.user_id = $1 AND n.organization_id = $2 AND r.read_at IS NOT NULL
          RETURNING r.notification_id`,
        [userId, organizationId]
      )) as [{ notification_id: string }[], number];
      if (rows.length === 0) return 0;
      const ids = [...new Set(rows.map((r) => r.notification_id))];
      // ::uuid[] — node-postgres binds string arrays as text[]; uuid = text has no operator
      await em.query(
        `DELETE FROM notifications n WHERE n.id = ANY($1::uuid[]) AND NOT EXISTS
           (SELECT 1 FROM notification_recipients r WHERE r.notification_id = n.id)`,
        [ids]
      );
      return rows.length;
    });
  }

  /**
   * Returns user IDs of all active admins in an organization.
   * Uses the permission_groups + group_users join pattern.
   */
  async getOrgAdminUserIds(organizationId: string): Promise<string[]> {
    const rows: { user_id: string }[] = await this.manager.query(
      `SELECT DISTINCT gu.user_id
         FROM group_users gu
         JOIN permission_groups pg ON pg.id = gu.group_id
         JOIN organization_users ou ON ou.user_id = gu.user_id AND ou.organization_id = $1
        WHERE pg.organization_id = $1
          AND pg.type = 'default'
          AND pg.name = 'admin'
          AND ou.status != 'archived'`,
      [organizationId]
    );
    return rows.map((r) => r.user_id);
  }
}
