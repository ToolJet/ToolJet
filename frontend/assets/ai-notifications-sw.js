/* eslint-env serviceworker */
/**
 * Notification-only service worker for ToolJet AI build notifications.
 *
 * Why a service worker at all: notification action buttons ("View output", "View details")
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

// Every notification this app raises is about work that has already finished, so every button
// on one ("View output", "View details") and the notification body itself mean the same thing:
// take me to the tab so I can look. There is nothing to carry out from here — the agent does
// not pause for input — so the worker focuses and gets out of the way.
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  notification.close();

  const data = notification.data || {};

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

      // Find the tab this build actually ran in, so the user lands on the conversation they
      // were notified about rather than whichever ToolJet tab happens to be topmost. Five
      // matchers, weakest last:
      //
      //  1. client id — the only exact one, and the only one that can tell two tabs of the
      //     same app apart. Everything below is a fallback for when the id handshake did not
      //     complete, or for notifications raised before this code shipped;
      //  2. exact href — only holds while the user has not navigated within the app;
      //  3. app path prefix (`/:workspaceId/apps/:slug`) — survives navigation between pages
      //     of the app, but ties between two tabs on the same app;
      //  4. app id anywhere in the URL — a backstop for notifications raised before the page
      //     started sending appPath, since notifications outlive a reload;
      //  5. any open tab — better than opening a duplicate window, though it may be showing a
      //     different app. Focusing the wrong ToolJet tab is a far smaller cost than spawning
      //     a second window onto one the user already has open.
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
        await target.focus();
        return;
      }

      // The tab that raised this is gone — every ToolJet tab is, in fact. Open the build's URL
      // rather than doing nothing, so the click still lands somewhere useful.
      if (data.url) await self.clients.openWindow(data.url);
    })()
  );
});
