// Pure helpers for customComponentLibrariesStore - no store/SSE/fetch access here, so
// these are unit-testable without mocking any of that.

import config from 'config';
import { dashlessId } from '@/AppBuilder/Widgets/libraryComponentRevision';
import type { CustomComponentLibrary } from '@/_services/customComponentLibraries.service';

// Builds bundle/css/manifest URLs for either a published revision ('v2') or a
// dev slot ('dev:{userId}' → the per-developer no-store endpoint). Lives in this leaf
// helpers file (rather than libraryComponentRevision.ts) so customComponentLibrariesStore
// can import it without a store <-> libraryComponentRevision import cycle.
export const libraryFileUrl = (libraryId: string, revision: string | undefined, file: string): string =>
  revision?.startsWith?.('dev:')
    ? `${config.apiUrl}/custom-component-libraries/${libraryId}/dev/${revision.slice(4)}/files/${file}`
    : `${config.apiUrl}/custom-component-libraries/${libraryId}/revisions/${revision}/files/${file}`;

// Manifests are cached by (libraryId, revision) — published revisions are immutable, so
// that pair alone is a stable key. A dev slot's content can change without the revision
// string changing, so devNonce (customComponentLibrariesStore's devBundleUpdatedAt) is
// folded in to bust the cache on each live-reload push.
export const buildManifestCacheKey = (libraryId: string, revision: string, devNonce?: number): string =>
  devNonce ? `${libraryId}@${revision}@${devNonce}` : `${libraryId}@${revision}`;

// devPinKeys: { [dashlessCorrelationId]: 'dev:{userId}' }, exactly as stored in
// globalSettings.customComponentLibraries.
type DevPinKeys = Record<string, string>;

// { libraryId: userId }
type OwnPins = Record<string, string>;

export const streamKey = (libraryId: string, userId: string): string => `${libraryId}:${userId}`;

// Resolves devPinKeys (keyed by the library's stable correlationId, dashless or dashed —
// not its workspace-scoped id, so pins keep resolving across import/export) against the
// library list (correlationId -> real libraryId), returning:
// - emails: { libraryId -> uploader email }, for every dev-pinned library (canvas badge)
// - ownPins: { libraryId -> userId }, only pins where userId === currentUserId (streams)
export function resolveDevPins(
  libraries: CustomComponentLibrary[],
  devPinKeys: DevPinKeys,
  currentUserId: string | undefined
): { emails: Record<string, string | null>; ownPins: OwnPins } {
  const emails: Record<string, string | null> = {};
  const ownPins: OwnPins = {};

  libraries.forEach((lib) => {
    // Legacy pins may still be keyed by the dashed correlationId (pre dashlessId-normalization,
    // see libraryComponentRevision.ts's dashlessId) — fall back to it so those still resolve.
    const value = devPinKeys[dashlessId(lib.correlationId) ?? ''] ?? devPinKeys[lib.correlationId ?? ''];
    if (typeof value !== 'string' || !value.startsWith('dev:')) return;

    const userId = value.slice(4);
    const bundle = lib.devBundles?.find((d) => d.userId === userId);
    emails[lib.id] = bundle?.userEmail ?? null;
    if (userId === currentUserId) ownPins[lib.id] = userId;
  });

  return { emails, ownPins };
}

// Given the currently-open stream keys and the pins that should be streaming for this
// viewer, returns which keys to close and which (libraryId, userId) pairs to open.
export function diffStreamKeys(
  activeKeys: string[],
  ownPins: OwnPins
): { toClose: string[]; toOpen: [string, string][] } {
  const wantedKeys = new Set(Object.entries(ownPins).map(([libraryId, userId]) => streamKey(libraryId, userId)));

  const toClose = activeKeys.filter((key) => !wantedKeys.has(key));
  const toOpen = Object.entries(ownPins).filter(
    ([libraryId, userId]) => !activeKeys.includes(streamKey(libraryId, userId))
  );

  return { toClose, toOpen };
}
