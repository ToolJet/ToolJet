import { useLibraryManifest } from '@/AppBuilder/Widgets/hooks/useLibraryManifest';

// Thin wrapper over the shared manifest cache (useLibraryManifest) for whatever
// revision the palette should currently display. When `current` is the
// library's latest revision, its manifest is already in hand (`library.manifest`,
// straight from the list payload) — skip the shared cache/fetch entirely so that case
// stays synchronous (no render needing to wait on an effect + fetch to resolve).
export const useResolvedManifest = (library, current, latest) => {
  const manifest = useLibraryManifest(library.id, current === latest ? undefined : current);
  return current === latest ? library.manifest : manifest;
};
