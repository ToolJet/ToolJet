import { appService } from '@/_services/app.service';
import { sessionService } from '@/_services/session.service';
import { teardownFrontendMetrics } from '@/_services/frontend-metrics.service';

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Shared by the desktop profile menu and the mobile workspace drawer.
export async function handleLogout() {
  teardownFrontendMetrics();
  // Get latest config first to ensure we have the most up-to-date custom logout url
  await appService
    .getConfig()
    .then((config: typeof window.public_config) => {
      window.public_config = config;
      const customLogoutUrl = window.public_config?.CUSTOM_LOGOUT_URL;
      if (customLogoutUrl && isValidUrl(customLogoutUrl)) {
        sessionService.logout().then(() => {
          window.location.href = customLogoutUrl;
        });
        return;
      }
      sessionService.logout();
    })
    .catch(() => {
      sessionService.logout();
    });
}
