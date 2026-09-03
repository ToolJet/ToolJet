// Pure helpers for customComponentPreviewStore.syncDevPinStreams - no store/SSE/fetch
// access here, so these are unit-testable without mocking any of that.

export const streamKey = (libraryId, userId) => `${libraryId}:${userId}`;

// devPinKeys: { [dashlessCorrelationId]: 'dev:{userId}' }, exactly as stored in
// globalSettings.customComponentLibraries (pins are keyed by the library's stable
// correlationId, not its workspace-scoped id, so they keep resolving across import/export).
// Resolves them against the library list (dashless keys -> real libraryIds), returning:
// - emails: { libraryId -> uploader email }, for every dev-pinned library (canvas badge)
// - ownPins: { libraryId -> userId }, only pins where userId === currentUserId (streams)
export function resolveDevPins(libraries, devPinKeys, currentUserId) {
  const emails = {};
  const ownPins = {};

  libraries.forEach((lib) => {
    const dashlessId = lib.correlationId.replace(/-/g, '');
    const value = devPinKeys[dashlessId];
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
export function diffStreamKeys(activeKeys, ownPins) {
  const wantedKeys = new Set(Object.entries(ownPins).map(([libraryId, userId]) => streamKey(libraryId, userId)));

  const toClose = activeKeys.filter((key) => !wantedKeys.has(key));
  const toOpen = Object.entries(ownPins).filter(
    ([libraryId, userId]) => !activeKeys.includes(streamKey(libraryId, userId))
  );

  return { toClose, toOpen };
}
