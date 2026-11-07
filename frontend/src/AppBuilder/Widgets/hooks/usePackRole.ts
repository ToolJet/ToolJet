import useStore from '@/AppBuilder/_stores/store';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { useBuiltinPacksStore } from '@/_stores/builtinPacksStore';
import { buildManifestCacheKey } from '@/_helpers/customComponentLibrariesStoreUtils';
import { getLibraryComponentIdentity, resolveEffectiveRevision } from '@/AppBuilder/Widgets/libraryComponentRevision';

// The UI 2.0 role a component pack's widget declares in its manifest (stat, table, ...), for layout rules that treat a
// pack widget like the UI 2.0 widget it stands for: a shipped pack's PackComponent, or a library's LibraryComponent.
// Undefined for any other widget, or until the manifest has loaded (the widget itself fetches it into the shared cache).
export const usePackRole = (componentType: string | undefined, id: string, moduleId: string): string | undefined => {
  const isLibrary = componentType === 'LibraryComponent';
  const isPack = componentType === 'PackComponent';

  const { libraryId, correlationId, componentName } = useStore(
    (state: any) => (isLibrary ? getLibraryComponentIdentity(state.getComponentDefinition(id, moduleId) ?? {}) : {}),
    (a: any, b: any) =>
      a.libraryId === b.libraryId && a.correlationId === b.correlationId && a.componentName === b.componentName
  );
  const revision = useStore((state: any) =>
    isLibrary ? resolveEffectiveRevision(state.globalSettings?.customComponentLibraries, correlationId) : undefined
  );
  const key = libraryId && revision ? buildManifestCacheKey(libraryId, revision) : undefined;
  const libraryRole = useCustomComponentLibrariesStore((state: any) =>
    key && componentName ? state.manifests[key]?.components?.[componentName]?.role : undefined
  );

  const pack = useStore((state: any) => {
    if (!isPack) return undefined;
    const properties = state.getComponentDefinition(id, moduleId)?.component?.definition?.properties ?? {};
    return `${properties.pack?.value ?? ''}|${properties.componentName?.value ?? ''}`;
  });
  const packRole = useBuiltinPacksStore((state: any) => {
    if (!pack) return undefined;
    const [packId, name] = pack.split('|');
    return packId && name ? state.manifests[packId]?.components?.[name]?.role : undefined;
  });

  return isPack ? packRole : libraryRole;
};
