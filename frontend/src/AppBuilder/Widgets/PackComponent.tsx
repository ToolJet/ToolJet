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
  const packsListed = useBuiltinPacksStore((state: { packs: unknown[] | null }) => state.packs !== null);
  const missingComponent = !!pack && !!manifest?.components && !!componentName && !manifest.components[componentName];
  if (packsListed && (!pack || missingComponent)) {
    const message = !packId
      ? 'This component names no pack.'
      : !pack
        ? `This component's pack ("${packId}") isn't installed on this ToolJet.`
        : `The pack "${packId}" has no component "${componentName}".`;
    return (
      <div
        role="alert"
        data-cy="pack-component-error"
        style={{
          width: '100%',
          height: '100%',
          padding: 12,
          overflow: 'auto',
          font: '12px/1.4 monospace',
          color: 'var(--text-danger, #d72d39)',
          border: '1px dashed var(--text-danger, #d72d39)',
          borderRadius: 6,
          background: 'var(--surfaces-surface-01, transparent)',
        }}
      >
        {message}
      </div>
    );
  }

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

  return <SdkComponentHost {...(props as any)} properties={properties} source={source} metaKeys={META_KEYS} />;
};

export default PackComponent;
