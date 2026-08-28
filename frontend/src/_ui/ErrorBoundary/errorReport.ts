import useStore from '@/AppBuilder/_stores/store';
import { fetchEdition } from '@/modules/common/helpers/utils';

interface ErrorReportInput {
  error?: (Error & { stack?: string }) | null;
  errorInfo?: { componentStack?: string | null } | null;
  label?: string;
  eventId?: string | null;
}

export interface ErrorContext {
  appId?: string;
  versionId?: string;
  pageId?: string;
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
    context.versionId = state?.currentVersionId;
    context.pageId = state?.getCurrentPageId?.('canvas');
    context.environment = state?.selectedEnvironment?.name;
    context.mode = state?.getCurrentMode?.('canvas');
  } catch {
    // store may not be ready; context fields fall back to n/a
  }
  return context;
}

// Builds a copy-pasteable, support-friendly error report from a caught error.
export function buildErrorReport({ error, errorInfo, label, eventId }: ErrorReportInput = {}): string {
  const ctx = getErrorContext();
  // Sentry only runs on cloud; the event id is meaningless on CE/EE, so hide it there.
  const isCloud = fetchEdition() === 'cloud';

  const lines = [
    `Area:        ${label || 'Unknown'}`,
    `Error:       ${error?.name || 'Error'}: ${error?.message || String(error || 'Unknown error')}`,
    ...(isCloud ? [`Sentry ID:   ${eventId || 'n/a'}`] : []),
    `App ID:      ${ctx.appId || 'n/a'}`,
    `Version ID:  ${ctx.versionId || 'n/a'}`,
    `Page ID:     ${ctx.pageId || 'n/a'}`,
    `Environment: ${ctx.environment || 'n/a'}`,
    `Mode:        ${ctx.mode || 'n/a'}`,
    `ToolJet:     ${ctx.tjVersion}`,
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
