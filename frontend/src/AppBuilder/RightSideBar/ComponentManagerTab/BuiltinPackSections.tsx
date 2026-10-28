import React, { useEffect } from 'react';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { useLibraryManifest } from '@/AppBuilder/Widgets/hooks/useLibraryManifest';
import { builtinIdentity, BUILTIN_PREFIX, type BuiltinPack } from '@/_helpers/builtinPacks';
import type { ManifestComponent } from '@/AppBuilder/types/libraryComponent.types';
import { CustomComponentCard } from './CustomComponentsTab';

const CardComponent = CustomComponentCard as React.ComponentType<any>;

// The packs that ship with ToolJet, listed in the Components tab next to the native widgets (not under Custom
// components): one accordion section per pack. Search narrows them by component name like the native list.
export const useBuiltinPacks = (): BuiltinPack[] => {
  const packs = useCustomComponentLibrariesStore((state: any) => state.builtinPacks);
  useEffect(() => {
    useCustomComponentLibrariesStore.getState().fetchBuiltinPacks();
  }, []);
  return packs ?? [];
};

const matches = (name: string, component: ManifestComponent, query: string): boolean =>
  !query || `${component.displayName ?? name} ${name}`.toLowerCase().includes(query.toLowerCase());

export const BuiltinPackCards = ({ pack, searchQuery = '' }: { pack: BuiltinPack; searchQuery?: string }) => {
  const { libraryId, correlationId } = builtinIdentity(pack.pack);
  const revision = `${BUILTIN_PREFIX}${pack.hash}`;
  const manifest = useLibraryManifest(libraryId, revision);
  const components = Object.entries(manifest?.components ?? {}).filter(([name, component]) =>
    matches(name, component, searchQuery)
  );
  if (components.length === 0) return null;
  return (
    <div className="custom-library-section-content" data-cy={`builtin-pack-${pack.pack}`}>
      {components.map(([name, component]) => (
        <CardComponent
          key={name}
          libraryId={libraryId}
          correlationId={correlationId}
          libraryName={pack.displayName}
          revisionId={revision}
          name={name}
          componentConfig={component}
        />
      ))}
    </div>
  );
};
