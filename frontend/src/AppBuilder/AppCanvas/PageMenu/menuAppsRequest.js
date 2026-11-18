import { appsService } from '@/_services';

// How long a finished request is reused. Long enough for everything that asks during one app
// load (desktop menu, mobile menu, the All apps popup) to share one request; short enough that
// opening an app again, even without a full page reload, asks the server again and so picks up
// releases, renames, folder moves and access changes.
export const MENU_APPS_REUSE_MS = 5000;

let cached = null; // { appId, promise, settledAt }

/**
 * Released apps the current user can open, for the "All apps" nav item of app `appId`.
 * Concurrent and back-to-back calls for the same app share one request; a failed request is
 * not reused, so the next call retries.
 */
export const fetchMenuApps = (appId, { now = Date.now } = {}) => {
  const reusable =
    cached && cached.appId === appId && (cached.settledAt === null || now() - cached.settledAt < MENU_APPS_REUSE_MS);
  if (reusable) return cached.promise;

  const entry = { appId, settledAt: null };
  entry.promise = appsService
    .getMenuApps()
    .then((response) => {
      entry.settledAt = now();
      return response?.apps ?? [];
    })
    .catch(() => {
      if (cached === entry) cached = null;
      return [];
    });
  cached = entry;
  return entry.promise;
};

/** Test seam: forget the shared request. */
export const resetMenuAppsRequest = () => {
  cached = null;
};
