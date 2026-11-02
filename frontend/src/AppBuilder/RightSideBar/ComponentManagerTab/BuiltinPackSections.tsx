import React, { useMemo } from 'react';
import { usePackManifest } from '@/_stores/builtinPacksStore';
import type { BuiltinPack } from '@/_helpers/builtinPacks';
import type { ManifestComponent } from '@/AppBuilder/types/libraryComponent.types';
import { SdkComponentCard } from './CustomComponentsTab';
import { groupPackComponents } from './packPalette';
import { manifestDefaultSize } from './utils';

const Card = SdkComponentCard as React.ComponentType<any>;

type PaletteSection = { key: string; title: string; items: [string, ManifestComponent][] };

export { useBuiltinPacks } from '@/_stores/builtinPacksStore';

// A component matches by the name its tile shows ("Scatter Chart") or its export name ("ScatterChart"), ignoring
// case and spaces, as the custom libraries' search does.
const squash = (text: unknown) =>
  String(text ?? '')
    .toLowerCase()
    .replace(/\s+/g, '');

const matches = (name: string, component: ManifestComponent, query: string): boolean =>
  !query || squash(name).includes(squash(query)) || squash(component.displayName).includes(squash(query));

// One pack component's tile: drops a PackComponent that names its pack and component, pre-filled with the
// manifest's defaults. Nothing is pinned: the instance always draws the build the release ships.
const PackComponentCard = ({ pack, name, component }: { pack: string; name: string; component: ManifestComponent }) => {
  const { displayName, description, props = [], styles = [], defaultWidth, defaultHeight, role } = component as any;
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
      role={role}
      tile
    />
  );
};

// The pack picked for the app (the Components panel's library picker): its components in ToolJet's palette sections,
// placed by the native widget each stands in for (its role), with that widget's icon.
export const PackSection = ({ pack, searchQuery = '' }: { pack: BuiltinPack; searchQuery?: string }) => {
  const manifest = usePackManifest(pack.pack);
  const sections = useMemo(() => {
    const components = Object.entries(manifest?.components ?? {}).filter(([name, component]) =>
      matches(name, component, searchQuery)
    );
    return (groupPackComponents(components) ?? []) as PaletteSection[];
  }, [manifest, searchQuery]);

  if (!manifest) return null;
  if (sections.length === 0) {
    return (
      <div className="empty" data-cy={`builtin-pack-${pack.pack}`}>
        <p className="empty-title">No results found</p>
      </div>
    );
  }
  return (
    <div className="custom-components-tab" data-cy={`builtin-pack-${pack.pack}`}>
      <div className="custom-library-section custom-library-section--picked">
        <div className="custom-library-section-content custom-library-pack-sections">
          {sections.map((section) => (
            <div key={section.key} className="custom-library-pack-section" data-cy={`pack-section-${section.key}`}>
              <div className="custom-library-pack-section-title">{section.title}</div>
              <div className="component-card-group-wrapper">
                {section.items.map(([name, component]) => (
                  <PackComponentCard key={name} pack={pack.pack} name={name} component={component} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
