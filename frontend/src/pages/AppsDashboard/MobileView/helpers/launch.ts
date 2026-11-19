import type { AppItem } from '../../dummyData/types';

// Mirrors the desktop LaunchButton tooltips.
const LAUNCH_BLOCKED_MESSAGES = {
  not_released: 'App does not have a deployed version',
  maintenance: 'This app is under maintenance',
  no_released_access: 'You do not have permission to access released apps',
} as const;

export type AppTapResult = { type: 'open'; path: string } | { type: 'blocked'; message: string } | { type: 'none' };

// `actions.launch` is null for stub apps, which have nothing to open.
export function getAppTapResult(app: AppItem): AppTapResult {
  const launch = app.actions?.launch;
  if (!launch) return { type: 'none' };
  if (launch.reason) return { type: 'blocked', message: LAUNCH_BLOCKED_MESSAGES[launch.reason] };
  return { type: 'open', path: `/applications/${app.slug}` };
}
