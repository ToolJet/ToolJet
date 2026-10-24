import useStore from '@/AppBuilder/_stores/store';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { buildManifestCacheKey } from '@/_helpers/customComponentLibrariesStoreUtils';
import { getLibraryComponentIdentity, resolveEffectiveRevision } from '@/AppBuilder/Widgets/libraryComponentRevision';

// The UI 2.0 role a component pack's widget declares in its manifest (stat, table, ...), for layout rules that treat a
// pack widget like the UI 2.0 widget it stands for. Undefined for any other widget, or until the manifest has loaded
// (the widget itself fetches it into the shared cache).
export const usePackRole = (componentType: string | undefined, id: string, moduleId: string): string | undefined => {
  const isPack = componentType === 'LibraryComponent';
  const { libraryId, correlationId, componentName } = useStore(
    (state: any) => (isPack ? getLibraryComponentIdentity(state.getComponentDefinition(id, moduleId) ?? {}) : {}),
    (a: any, b: any) =>
      a.libraryId === b.libraryId && a.correlationId === b.correlationId && a.componentName === b.componentName
  );
  const revision = useStore((state: any) =>
    isPack ? resolveEffectiveRevision(state.globalSettings?.customComponentLibraries, correlationId) : undefined
  );
  const key = libraryId && revision ? buildManifestCacheKey(libraryId, revision) : undefined;
  return useCustomComponentLibrariesStore((state: any) =>
    key && componentName ? state.manifests[key]?.components?.[componentName]?.role : undefined
  );
};
