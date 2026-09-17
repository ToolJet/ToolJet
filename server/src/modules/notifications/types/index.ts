import { NOTIFICATION_TYPE } from '../constants';

export interface NotifyParams {
  organizationId: string;
  userId: string; // v1 per-user only
  type: NOTIFICATION_TYPE;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
  dedupeKey?: string; // idempotency: skip insert if a row with this key exists
  toast?: boolean; // emphasize on live arrival; rides realtime payload only, never persisted
}

export interface NotificationListItem {
  recipientId: string;
  id: string;
  type: NOTIFICATION_TYPE;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  readAt: Date | null;
  createdAt: Date;
}
