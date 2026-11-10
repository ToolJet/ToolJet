import type { ManifestComponent } from '@/AppBuilder/types/libraryComponent.types';
import { packLabel } from '@/AppBuilder/RightSideBar/ComponentManagerTab/componentLibrary';

/**
 * What a pack instance draws, shown first in its Properties tab (QA item 8): its pack, as the Components panel names it,
 * and the component's display name; its code name until the manifest loads. Nothing for an instance with no component.
 */
export const packIdentityRows = (
  pack: string | undefined,
  componentName: string | undefined,
  componentManifest: ManifestComponent | undefined,
  packDisplayName?: string
): [string, string?][] =>
  pack && componentName
    ? [
        ['Pack', packLabel(pack, packDisplayName)],
        ['Component', componentManifest?.displayName ?? componentName],
      ]
    : [];
