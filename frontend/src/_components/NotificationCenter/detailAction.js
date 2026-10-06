import { versionLink } from '@/_helpers/backgroundJobs';

// One rule for row click AND toast "View details" — capability derived from payload
// presence so it can never desync from the data:
//   metadata.error present -> detail modal (renderable trace/body)
//   link present           -> navigate
//   created version        -> navigate to it in the editor
//   neither                -> no detail affordance
// 'git-sync-modal' is a sentinel, not a URL (P2 deep-link) — not navigable yet.
export function detailAction(notification) {
  const metadata = notification?.metadata;
  if (metadata?.error) return { kind: 'modal' };
  if (notification?.type === 'success' && metadata?.source === 'app-version' && metadata.action === 'version-create') {
    return { kind: 'link', href: versionLink(metadata) };
  }
  if (notification?.link && notification.link !== 'git-sync-modal') return { kind: 'link', href: notification.link };
  return null;
}
