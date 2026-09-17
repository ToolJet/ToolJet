import useStore from '@/AppBuilder/_stores/store';
import { authenticationService } from '@/_services/authentication.service';
import { normalizePin, dashlessId } from '@/AppBuilder/Widgets/libraryComponentRevision';

// Single source of truth for "what revision is this library showing" — shared by the
// palette (LibrarySection) and the dropdown (VersionPicker) so they can't disagree.
// `current` is `pin ?? latest`: the pin IS the selection, written immediately on pick
// (invariant #14, HANDOFF-NISHIDH.md). A dev-only library (no revisions, no pin yet)
// falls back to the LOGGED-IN USER'S OWN dev bundle if they have one — same scoping as
// the live-reload stream (customComponentLibrariesStore.syncDevPinStreams), since your
// own bundle is the only one actually live for you without an explicit pick. This makes
// `current` viewer-dependent until a real pin exists; nothing is written to
// globalSettings here — only an explicit VersionPicker pick or auto-pin-on-drop does that.
export const useLibraryCurrentRevision = (library) => {
  const pins = useStore((state) => state.globalSettings?.customComponentLibraries);
  const latest = library.revisions[0]?.version;
  const pin = normalizePin(pins?.[dashlessId(library.correlationId)] ?? pins?.[library.correlationId]);
  const currentUserId = authenticationService.currentSessionValue?.current_user?.id;
  const ownDevBundle = !latest ? library.devBundles?.find((d) => d.userId === currentUserId) : null;
  const current = pin ?? latest ?? (ownDevBundle ? `dev:${ownDevBundle.userId}` : undefined);
  return { current, pin, latest };
};
