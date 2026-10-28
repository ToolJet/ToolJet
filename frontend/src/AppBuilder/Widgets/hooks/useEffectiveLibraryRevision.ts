import useStore from '@/AppBuilder/_stores/store';
import { resolveEffectiveRevision } from '@/AppBuilder/Widgets/libraryComponentRevision';

// F5+: the pin IS the selection now — VersionPicker writes it immediately whether the
// chosen entry is a revision ('v3') or a dev bundle ('dev:{userId}'); there is no
// separate session-local preview layer anymore.
export const useEffectiveLibraryRevision = (correlationId: string | undefined): string | undefined =>
  useStore((state: any) => resolveEffectiveRevision(state.globalSettings?.customComponentLibraries, correlationId));
