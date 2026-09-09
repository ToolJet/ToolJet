// Pure helpers for customComponentLibrariesStore.syncDevPinStreams - no store/SSE/fetch
// access here, so these are unit-testable without mocking any of that.

import { dashlessId } from '@/AppBuilder/Widgets/libraryComponentRevision';
import type { CustomComponentLibrary } from '@/_services/customComponentLibraries.service';

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
