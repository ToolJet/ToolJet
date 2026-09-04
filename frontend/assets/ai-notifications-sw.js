/* eslint-env serviceworker */
/**
 * Notification-only service worker for ToolJet AI build notifications.
 *
 * Why a service worker at all: notification action buttons ("Approve", "View details")
 * are only supported via ServiceWorkerRegistration.showNotification(). The plain
 * `new Notification()` constructor silently drops `actions`, and is unsupported outright
 * on Safari and Android Chrome.
 *
 * Scope note: this worker is served from /assets/, so it only *controls* pages under
 * /assets/ — i.e. none. That is fine and intentional. Showing a notification and focusing
 * a tab need a registration, not control of the page, and `includeUncontrolled: true`
 * below reaches every same-origin tab regardless of scope. Registering at the site root
 * would need a `Service-Worker-Allowed` response header and buys nothing here.
 *
 * It deliberately does NOT install a fetch handler or cache anything. A caching worker in
 * a self-hosted app is a support burden, and none of it is needed to show a notification.
 */

self.addEventListener('install', () => {
  // Take over immediately rather than waiting for existing tabs to close, so a user who
  // just granted permission gets notifications in the session where they granted it.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Tells a page its own service-worker client id.
//
// A page cannot read its own client id — only the worker can see it, as `event.source.id` on
// a message the page sent. The page asks once, remembers the answer, and stamps it on every
// notification it raises, which is what lets `notificationclick` focus the exact tab that
// started the build. Nothing URL-based can do this: two tabs on the same app have identical
// URLs, and `clients.matchAll()` orders by most-recently-focused, so the URL matchers always
// resolve to the tab the user is looking at instead of the one that is building.
//
// `event.source` is null in some browsers for pages this worker does not control (its scope
// is /assets/, so it controls none of them). The reply is then null and the caller falls back
// to the URL matchers, which is exactly the previous behaviour.
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'TOOLJET_AI_WHOAMI') return;
  const port = event.ports && event.ports[0];
  if (port) port.postMessage({ clientId: event.source ? event.source.id : null });
});

// Actions that carry out the step rather than take you somewhere to look at it. These are
// dispatched to the page WITHOUT focusing the tab: the whole point of the feature is to let
// someone keep working elsewhere, so approving a step should not drag them back to ToolJet.
// Everything else ("View details", "View output", "View options", or a click on the
// notification body) is a request to go and look, so it does focus the tab.
const BACKGROUND_ACTIONS = new Set(['approve', 'run-query', 'preview-query']);

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  notification.close();

  // `event.action` is '' when the body of the notification is clicked rather than one of
  // its buttons — that case just focuses the tab without dispatching an action.
  const action = event.action || null;
  const data = notification.data || {};

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

      // Find the tab this build is actually running in — its store holds the conversation
      // the action applies to, and with several ToolJet tabs open the others cannot service
      // it. Five matchers, weakest last:
      //
      //  1. client id — the only exact one, and the only one that can tell two tabs of the
      //     same app apart. Everything below is a fallback for when the id handshake did not
      //     complete, or for notifications raised before this code shipped;
      //  2. exact href — only holds while the user has not navigated within the app;
      //  3. app path prefix (`/:workspaceId/apps/:slug`) — survives navigation between pages
      //     of the app, but ties between two tabs on the same app;
      //  4. app id anywhere in the URL — a backstop for notifications raised before the page
      //     started sending appPath, since notifications outlive a reload;
      //  5. any open tab — better than opening a duplicate window, but it may be the wrong
      //     app, in which case triggerInteractiveCta no-ops on a message that tab does not
      //     have. That is the existing stale-notification behaviour, not a new failure.
      const matchesApp = (client) => {
        if (!data.appPath) return false;
        try {
          const path = new URL(client.url).pathname;
          // Boundary-checked rather than a bare startsWith, so app slug "abc" does not
          // match a second app whose slug is "abc-2".
          return path === data.appPath || path.startsWith(`${data.appPath}/`);
        } catch {
          return false;
        }
      };

      const target =
        clientList.find((client) => data.clientId && client.id === data.clientId) ??
        clientList.find((client) => data.url && client.url === data.url) ??
        clientList.find(matchesApp) ??
        clientList.find((client) => data.appId && client.url.includes(data.appId)) ??
        clientList[0];

      if (target) {
        // Focus first for "go and look" actions, so the page is already in front when the
        // message lands. Background actions skip it entirely and stay out of the way.
        if (!BACKGROUND_ACTIONS.has(action)) await target.focus();

        target.postMessage({
          type: 'TOOLJET_AI_NOTIFICATION_CLICK',
          action,
          messageId: data.messageId ?? null,
          widgetName: data.widgetName ?? null,
          conversationId: data.conversationId ?? null,
        });
        return;
      }

      // Nothing open to act on. Only worth opening a window for the "go and look" cases —
      // a background approve has no live build to resume into.
      if (data.url && !BACKGROUND_ACTIONS.has(action)) await self.clients.openWindow(data.url);
    })()
  );
});
