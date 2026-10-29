import React, { useState } from 'react';

import useStore from '@/AppBuilder/_stores/store';
import { libraryFileUrl } from '@/_helpers/customComponentLibrariesStoreUtils';
import { useEffectiveLibraryRevision } from './hooks/useEffectiveLibraryRevision';
import { useLibraryManifest } from './hooks/useLibraryManifest';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { getLibraryComponentRuntime } from './LibraryComponent/inlineRuntime';
import SdkComponentHost from './LibraryComponent/SdkComponentHost';
import { isBuiltInPack } from './libraryComponentRevision';

const DevBadge = ({ label }) => (
  <div className="tw-absolute tw-left-0 -tw-bottom-6 tw-h-5 tw-inline-flex tw-items-center tw-px-1 tw-py-0.5 tw-rounded-md tw-text-white tw-text-sm tw-font-medium tw-whitespace-nowrap tw-pointer-events-none tw-z-10 tw-bg-background-success-strong">
    dev: {label}
  </div>
);

const META_KEYS = ['libraryId', 'correlationId', 'libraryName', 'componentName'];

/* A component from a custom-component library a workspace uploaded: which revision it draws (published, pinned, or a
   developer's live preview) and whether the plan allows custom components. SdkComponentHost draws it. */
const LibraryComponent = ({ properties = {}, ...props }) => {
  const { libraryId, correlationId, componentName } = properties;

  const currentMode = useStore((state) => state.modeStore?.modules?.canvas?.currentMode ?? 'view');
  // A built-in pack saved as a library instance (before PackComponent) is on every plan; another custom library needs
  // the custom component libraries term.
  const hasLicenseTerm = useStore((state) => state.license?.featureAccess?.customComponentLibraries === true);
  const licensed = hasLicenseTerm || isBuiltInPack(correlationId);

  const effectiveRevision = useEffectiveLibraryRevision(correlationId);
  const isDevPin = Boolean(effectiveRevision?.startsWith?.('dev:'));
  const devUserId = isDevPin ? effectiveRevision.slice(4) : undefined;

  const devEmail = useCustomComponentLibrariesStore((state) => state.devPreviewEmailsByUserId?.[devUserId]);
  const devNonce = useCustomComponentLibrariesStore((state) =>
    isDevPin ? state.devBundleUpdatedAt?.[libraryId] : undefined
  );

  const badge = isDevPin && currentMode === 'edit' ? <DevBadge label={devEmail ?? devUserId} /> : null;

  const [runtime] = useState(() => getLibraryComponentRuntime());
  const manifest = useLibraryManifest(libraryId, effectiveRevision);

  const configured = Boolean(libraryId && componentName && effectiveRevision);
  const source = configured
    ? {
        key: `${libraryId}|${effectiveRevision}|${componentName}|${devNonce ?? ''}`,
        cacheKey: `${libraryId}|${effectiveRevision}|${devNonce ?? ''}`,
        bundleUrl: libraryFileUrl(libraryId, effectiveRevision, 'index.js'),
        cssUrl: libraryFileUrl(libraryId, effectiveRevision, 'index.css'),
        componentName,
        manifest,
        runtime,
        isDevBuild: isDevPin,
      }
    : null;

  return (
    <SdkComponentHost
      {...props}
      properties={properties}
      source={source}
      metaKeys={META_KEYS}
      blocked={!licensed}
      badge={badge}
    />
  );
};

export default LibraryComponent;
