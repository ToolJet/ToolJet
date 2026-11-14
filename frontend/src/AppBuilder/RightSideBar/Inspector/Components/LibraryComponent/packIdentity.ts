import type { ManifestComponent } from '@/AppBuilder/types/libraryComponent.types';
import { packLabel } from '@/AppBuilder/RightSideBar/ComponentManagerTab/componentLibrary';

export type PackIdentity = { library: string; component: string };

/**
 * What a pack instance draws, shown first in its Properties tab (QA item 8): its library, as the Components panel names
 * it, and the component's display name; its code name until the manifest loads. Null for an instance with no component.
 */
export const packIdentity = (
  pack: string | undefined,
  componentName: string | undefined,
  componentManifest: ManifestComponent | undefined,
  packDisplayName?: string
): PackIdentity | null =>
  pack && componentName
    ? { library: packLabel(pack, packDisplayName), component: componentManifest?.displayName ?? componentName }
    : null;

/**
 * What a custom library's instance draws, for the same strip: the library's name (as the workspace now calls it, else
 * as it was when the instance was dropped) and the component's display name, its code name until the manifest loads.
 * Null until both are known.
 */
export const libraryIdentity = (
  libraryName: string | undefined,
  componentName: string | undefined,
  componentManifest: ManifestComponent | undefined
): PackIdentity | null =>
  libraryName && componentName
    ? { library: libraryName, component: componentManifest?.displayName ?? componentName }
    : null;
