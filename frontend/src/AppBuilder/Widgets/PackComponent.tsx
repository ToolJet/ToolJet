import React from 'react';

import { packFileUrl } from '@/_helpers/builtinPacks';
import { useBuiltinPack, useBuiltinPacksStore, usePackManifest } from '@/_stores/builtinPacksStore';
import SdkComponentHost from './LibraryComponent/SdkComponentHost';

const META_KEYS = ['pack', 'componentName'];

/* A component from a pack that ships with ToolJet (shadcn, Ant Design, Material UI). It always draws the build this
   release ships, inline, in every edition: there is no library, licence, version or runtime to pick. SdkComponentHost
   draws it, as it draws a custom component. */
const PackComponent = ({ properties = {}, ...props }: { properties?: Record<string, any>; [key: string]: any }) => {
  const { pack: packId, componentName } = properties;
  const pack = useBuiltinPack(packId);
  const manifest = usePackManifest(packId);
  // Until the pack list arrives (or while it failed) nothing says the pack is missing: a neutral box, not the Slot.
  const listing = useBuiltinPacksStore((state: { packs: unknown[] | null }) => state.packs === null);

  const source =
    pack && componentName
      ? {
          key: `${pack.pack}|${pack.hash}|${componentName}`,
          cacheKey: `pack:${pack.pack}|${pack.hash}`,
          bundleUrl: packFileUrl(pack, 'index.js'),
          cssUrl: packFileUrl(pack, 'index.css'),
          componentName,
          manifest,
          runtime: 'inline' as const,
        }
      : null;

  return (
    <SdkComponentHost
      {...(props as any)}
      properties={properties}
      source={source}
      pending={listing}
      metaKeys={META_KEYS}
    />
  );
};

export default PackComponent;
