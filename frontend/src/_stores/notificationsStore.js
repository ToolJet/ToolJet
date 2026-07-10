import config from 'config';
import { create, zustandDevTools } from './utils';
import { notificationsService } from '@/_services/notifications.service';
import { detailAction } from '@/_components/NotificationCenter/detailAction';
import { showNotificationToast } from '@/_components/NotificationCenter/NotificationToast';

const PAGE_SIZE = 20;

const initialState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  hasMore: false,
  loadingMore: false,
  detailNotification: null,
};

// Live notifications socket (auth via tj_auth_token cookie — sent automatically). Best-effort:
// REST fetch stays the source of truth; the socket only pushes deltas and backfills on reconnect.
let socket = null;
let reconnectTimer = null;
let manualClose = false;
const RECONNECT_MS = 5000;

function notificationsWsUrl() {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const isSecure = /https?:\/\//g.test(config.apiUrl);
  const path = config.apiUrl.replace(/(^\w+:|^)\/\//, '').replace('/api', '/ws/notifications');
  const host = isSecure ? path : `${window.location.host}${path}`;
  return `${proto}://${host}`;
}

export const useNotificationsStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        async fetch(status = 'all') {
          set({ isLoading: true, error: null });
          const res = await notificationsService.list({ status, limit: PAGE_SIZE });
          if (res.error) {
            set({ isLoading: false, error: res.error });
            return;
          }
          const fetched = res.data?.notifications ?? [];
          set({ items: fetched, isLoading: false, hasMore: fetched.length === PAGE_SIZE });
          get().actions.refreshUnread();
        },
        async loadMore() {
          const { hasMore, loadingMore, items } = get();
          if (!hasMore || loadingMore || items.length === 0) return;
          set({ loadingMore: true });
          const before = items[items.length - 1]?.createdAt;
          const res = await notificationsService.list({ status: 'all', limit: PAGE_SIZE, before });
          if (res.error) {
            set({ loadingMore: false });
            return;
          }
          const fetched = res.data?.notifications ?? [];
          set((s) => {
            const seen = new Set(s.items.map((n) => n.recipientId));
            const fresh = fetched.filter((n) => !seen.has(n.recipientId));
            return { items: [...s.items, ...fresh], loadingMore: false, hasMore: fetched.length === PAGE_SIZE };
          });
        },
        async refreshUnread() {
          const res = await notificationsService.unreadCount();
          if (!res.error) set({ unreadCount: res.data?.count ?? 0 });
        },
        async markRead(recipientId) {
          const target = get().items.find((n) => n.recipientId === recipientId);
          if (target?.readAt) return { error: null }; // already read — nothing to do
          const res = await notificationsService.markRead(recipientId);
          if (res.error) return { error: res.error };
          set((s) => ({
            items: s.items.map((n) => (n.recipientId === recipientId ? { ...n, readAt: new Date().toISOString() } : n)),
            unreadCount: Math.max(0, s.unreadCount - 1),
          }));
          return { error: null };
        },
        async remove(recipientId) {
          const target = get().items.find((n) => n.recipientId === recipientId);
          const res = await notificationsService.remove(recipientId);
          if (res.error) return { error: res.error };
          set((s) => ({
            items: s.items.filter((n) => n.recipientId !== recipientId),
            unreadCount: target && !target.readAt ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
          }));
          return { error: null };
        },
        async markAllRead() {
          const res = await notificationsService.markAllRead();
          if (res.error) return { error: res.error };
          set((s) => ({
            items: s.items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
            unreadCount: 0,
          }));
          return { error: null };
        },
        async clearRead() {
          const res = await notificationsService.clearRead();
          if (res.error) return { error: res.error };
          set((s) => ({ items: s.items.filter((n) => !n.readAt) })); // unread stay
          return { error: null };
        },
        // Opening a notification marks it read, then routes per detailAction (modal / link / nothing)
        openDetail(n) {
          if (!n?.recipientId) return;
          get().actions.markRead(n.recipientId);
          const action = detailAction(n);
          if (!action) return;
          if (action.kind === 'modal') set({ detailNotification: n });
          else window.open(action.href, '_blank', 'noopener');
        },
        closeDetail() {
          set({ detailNotification: null });
        },
        connect() {
          if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
          manualClose = false;
          try {
            socket = new WebSocket(notificationsWsUrl());
          } catch {
            return;
          }
          socket.addEventListener('open', () => {
            // Backfill anything missed while disconnected — socket is best-effort, DB is truth.
            get().actions.fetch('all');
          });
          socket.addEventListener('message', (e) => {
            try {
              const msg = JSON.parse(e.data);
              if (msg.event === 'notification') get().actions.receive(msg.data, msg.toast === true);
            } catch {
              /* ignore malformed frames */
            }
          });
          socket.addEventListener('close', () => {
            if (manualClose) return;
            clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => get().actions.connect(), RECONNECT_MS);
          });
        },
        disconnect() {
          manualClose = true;
          clearTimeout(reconnectTimer);
          socket?.close();
          socket = null;
        },
        receive(n, withToast = false) {
          if (!n?.recipientId) return;
          let added = false;
          set((s) => {
            if (s.items.some((it) => it.recipientId === n.recipientId)) return s; // dedupe re-delivery
            added = true;
            return { items: [n, ...s.items], unreadCount: s.unreadCount + 1 };
          });
          if (added && withToast) {
            const action = detailAction(n);
            showNotificationToast(n, action ? { onViewDetails: (notif) => get().actions.openDetail(notif) } : {});
          }
        },
      },
    }),
    { name: 'Notifications' }
  )
);

export const useNotificationsActions = () => useNotificationsStore((s) => s.actions);
