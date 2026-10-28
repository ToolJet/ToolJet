import { useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { resolveEffectiveRevision } from '@/AppBuilder/Widgets/libraryComponentRevision';
import { isBuiltinLibrary } from '@/_helpers/builtinPacks';

// F5+: the pin IS the selection now — VersionPicker writes it immediately whether the
// chosen entry is a revision ('v3') or a dev bundle ('dev:{userId}'); there is no
// separate session-local preview layer anymore. A built-in pack has no pin: it resolves
// to the version the server ships, once the server has listed its packs.
export const useEffectiveLibraryRevision = (correlationId: string | undefined): string | undefined => {
  const builtIn = isBuiltinLibrary(correlationId);
  const builtinHashes = useCustomComponentLibrariesStore((state: any) => (builtIn ? state.builtinHashes : undefined));
  useEffect(() => {
    if (builtIn) useCustomComponentLibrariesStore.getState().fetchBuiltinPacks();
  }, [builtIn]);
  const pins = useStore((state: any) => state.globalSettings?.customComponentLibraries);
  return resolveEffectiveRevision(pins, correlationId, builtinHashes);
};
