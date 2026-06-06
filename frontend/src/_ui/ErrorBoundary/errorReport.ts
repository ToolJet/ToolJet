import useStore from '@/AppBuilder/_stores/store';
import { authenticationService } from '@/_services';

interface ErrorReportInput {
  error?: (Error & { stack?: string }) | null;
  errorInfo?: { componentStack?: string | null } | null;
  label?: string;
  eventId?: string | null;
}

export interface ErrorContext {
  appId?: string;
  appName?: string;
  versionId?: string;
  pageId?: string;
  organizationId?: string;
  environment?: string;
  mode?: string;
  tjVersion: string;
}

// Snapshot of app/workspace context for debugging — shared by the Sentry capture
// (FallbackBoundary) and the copy-pasteable report. Works outside React.
export function getErrorContext(): ErrorContext {
  const context: ErrorContext = {
    tjVersion: (window as any)?.public_config?.RELEASE_VERSION || 'unknown',
  };
  try {
    const state = useStore.getState() as any;
    context.appId = state?.getAppId?.('canvas');
    context.appName = state?.appStore?.modules?.canvas?.app?.appName;
    context.versionId = state?.currentVersionId;
    context.pageId = state?.getCurrentPageId?.('canvas');
    context.environment = state?.selectedEnvironment?.name;
    context.mode = state?.getCurrentMode?.('canvas');
  } catch {
    // store may not be ready; context fields fall back to n/a
  }
  try {
    context.organizationId = authenticationService.currentSessionValue?.current_organization_id || undefined;
  } catch {
    // session may not be ready
  }
  return context;
}

// Builds a copy-pasteable, support-friendly error report from a caught error.
export function buildErrorReport({ error, errorInfo, label, eventId }: ErrorReportInput = {}): string {
  const ctx = getErrorContext();

  const lines = [
    `Area:        ${label || 'Unknown'}`,
    `Error:       ${error?.name || 'Error'}: ${error?.message || String(error || 'Unknown error')}`,
    `Sentry ID:   ${eventId || 'n/a'}`,
    `App ID:      ${ctx.appId || 'n/a'}`,
    `App name:    ${ctx.appName || 'n/a'}`,
    `Version ID:  ${ctx.versionId || 'n/a'}`,
    `Page ID:     ${ctx.pageId || 'n/a'}`,
    `Org ID:      ${ctx.organizationId || 'n/a'}`,
    `Environment: ${ctx.environment || 'n/a'}`,
    `Mode:        ${ctx.mode || 'n/a'}`,
    `ToolJet:     ${ctx.tjVersion}`,
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
