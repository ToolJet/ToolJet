import useStore from '@/AppBuilder/_stores/store';

// Builds a copy-pasteable, support-friendly error report from a caught error.
// Pulls app/version/page context straight from the store (works outside React).
export function buildErrorReport({ error, errorInfo, label, eventId } = {}) {
  let appId, versionId, pageId;
  try {
    const state = useStore.getState();
    appId = state?.getAppId?.('canvas');
    pageId = state?.getCurrentPageId?.('canvas');
    versionId = state?.currentVersionId;
  } catch {
    // store may not be ready; context fields fall back to n/a
  }

  const tjVersion = window?.public_config?.RELEASE_VERSION || 'unknown';

  const lines = [
    `Area:        ${label || 'Unknown'}`,
    `Error:       ${error?.name || 'Error'}: ${error?.message || String(error || 'Unknown error')}`,
    `Sentry ID:   ${eventId || 'n/a'}`,
    `App ID:      ${appId || 'n/a'}`,
    `Version ID:  ${versionId || 'n/a'}`,
    `Page ID:     ${pageId || 'n/a'}`,
    `ToolJet:     ${tjVersion}`,
    `URL:         ${window?.location?.href || 'n/a'}`,
    `Time:        ${new Date().toISOString()}`,
    '',
    'Stack:',
    error?.stack || 'n/a',
  ];

  if (errorInfo?.componentStack) {
    lines.push('', 'Component stack:', errorInfo.componentStack.trim());
  }

  return lines.join('\n');
}
