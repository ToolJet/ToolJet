import React, { useMemo } from 'react';
import { usePackManifest } from '@/_stores/builtinPacksStore';
import type { BuiltinPack } from '@/_helpers/builtinPacks';
import type { ManifestComponent } from '@/AppBuilder/types/libraryComponent.types';
import { SdkComponentCard } from './CustomComponentsTab';
import { manifestDefaultSize } from './utils';

const Card = SdkComponentCard as React.ComponentType<any>;

export { useBuiltinPacks } from '@/_stores/builtinPacksStore';

const matches = (name: string, component: ManifestComponent, query: string): boolean =>
  !query || `${component.displayName ?? name} ${name}`.toLowerCase().includes(query.toLowerCase());

// One pack component's card: drops a PackComponent that names its pack and component, pre-filled with the
// manifest's defaults. Nothing is pinned: the instance always draws the build the release ships.
const PackComponentCard = ({ pack, name, component }: { pack: string; name: string; component: ManifestComponent }) => {
  const { displayName, description, props = [], styles = [], defaultWidth, defaultHeight } = component as any;
  const dragComponent = useMemo(() => {
    const defaultSize = manifestDefaultSize({ defaultWidth, defaultHeight });
    return {
      component: 'PackComponent',
      displayName: name,
      defaultSize,
      libraryComponentInfo: { pack, componentName: name, props, styles, defaultSize },
    };
  }, [pack, name, props, styles, defaultWidth, defaultHeight]);

  return (
    <Card
      componentType="PackComponent"
      dragComponent={dragComponent}
      name={name}
      displayName={displayName}
      description={description}
    />
  );
};

// The packs that ship with ToolJet, listed in the Components tab next to the native widgets: one section per pack.
// Search narrows them by component name like the native list.
export const BuiltinPackCards = ({ pack, searchQuery = '' }: { pack: BuiltinPack; searchQuery?: string }) => {
  const manifest = usePackManifest(pack.pack);
  const components = Object.entries(manifest?.components ?? {}).filter(([name, component]) =>
    matches(name, component, searchQuery)
  );
  if (components.length === 0) return null;
  return (
    <div className="custom-library-section-content" data-cy={`builtin-pack-${pack.pack}`}>
      {components.map(([name, component]) => (
        <PackComponentCard key={name} pack={pack.pack} name={name} component={component} />
      ))}
    </div>
  );
};
