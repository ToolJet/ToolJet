import { create, zustandDevTools } from './utils';
import { notificationsService } from '@/_services/notifications.service';

const initialState = { items: [], unreadCount: 0, isLoading: false, error: null };

export const useNotificationsStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        async fetch(status = 'all') {
          set({ isLoading: true, error: null });
          const res = await notificationsService.list({ status, limit: 20 });
          if (res.error) {
            set({ isLoading: false, error: res.error });
            return;
          }
          set({ items: res.data?.notifications ?? [], isLoading: false });
          get().actions.refreshUnread();
        },
        async refreshUnread() {
          const res = await notificationsService.unreadCount();
          if (!res.error) set({ unreadCount: res.data?.count ?? 0 });
        },
        async markRead(recipientId) {
          const res = await notificationsService.markRead(recipientId);
          if (res.error) return;
          set((s) => ({
            items: s.items.map((n) => (n.recipientId === recipientId ? { ...n, readAt: new Date().toISOString() } : n)),
            unreadCount: Math.max(0, s.unreadCount - 1),
          }));
        },
        async markAllRead() {
          const res = await notificationsService.markAllRead();
          if (res.error) return;
          set((s) => ({
            items: s.items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
            unreadCount: 0,
          }));
        },
      },
    }),
    { name: 'Notifications' }
  )
);

export const useNotificationsActions = () => useNotificationsStore((s) => s.actions);
