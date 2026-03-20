import { sessionService } from '@/_services';
import useStore from '@/AppBuilder/_stores/store';

// Track pending SSO info refresh to avoid duplicate requests
let ssoInfoRefreshPromise = null;

/**
 * Refreshes ssoUserInfo in the editor globals when OIDC tokens have been updated on the backend.
 * Directly patches the Zustand resolved store so the editor sees updated ssoUserInfo without
 * triggering a full app reload via the session BehaviorSubject.
 * Called when response contains X-SSO-Info-Updated header.
 */
export async function refreshSsoInfo() {
  // Dedupe concurrent refresh requests
  if (ssoInfoRefreshPromise) {
    return ssoInfoRefreshPromise;
  }

  ssoInfoRefreshPromise = (async () => {
    try {
      const newSession = await sessionService.validateSession();
      if (newSession && !newSession.authentication_failed) {
        const ssoUserInfo = newSession?.sso_user_info;
        const role = newSession?.role?.name;
        // Directly update the editor globals store — avoids touching the session BehaviorSubject
        // which would trigger a full app reload via useAppData's currentSession effect.
        try {
          useStore.getState().setResolvedGlobals('currentUser', {
            ...(ssoUserInfo !== undefined && { ssoUserInfo }),
            ...(role !== undefined && { role }),
          });
        } catch {
          // Not in the editor context (store not initialized), safe to ignore
        }
      }
    } catch (error) {
      console.warn('[SSO Info Refresh] Failed to refresh session:', error);
    } finally {
      ssoInfoRefreshPromise = null;
    }
  })();

  return ssoInfoRefreshPromise;
}
