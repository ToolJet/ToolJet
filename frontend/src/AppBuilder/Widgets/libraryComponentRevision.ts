import { buildManifestCacheKey } from '@/_helpers/customComponentLibrariesStoreUtils';
import type { LibraryManifest, ManifestAction } from '@/AppBuilder/types/libraryComponent.types';

export type Pin = string | { revisionId?: string; revision_id?: string } | undefined | null;

interface ResolvedActionParam {
  handle: string;
  displayName: string;
  defaultValue?: unknown;
  type?: string;
  options?: unknown;
}

export interface ResolvedAction {
  handle: string;
  displayName: string;
  params: ResolvedActionParam[];
}

export interface ComponentIdentity {
  libraryId?: string;
  correlationId?: string;
  componentName?: string;
}

export interface ComponentDefinitionLike {
  component?: {
    definition?: {
      properties?: Record<string, { value?: string }>;
    };
  };
}

// Every call site passes a correlationId (pins are keyed by dashless correlationId,
// never by libraryId — see resolveEffectiveRevision below), so this takes a generic
// id rather than implying it's library-specific.
export const dashlessId = (id: string | undefined): string | undefined => id?.replace(/-/g, '');

export const normalizePin = (pin: Pin): string | undefined =>
  typeof pin === 'string' ? pin : (pin?.revisionId ?? pin?.revision_id);

// F5+: the pin IS the selection now — VersionPicker writes it immediately whether the
// chosen entry is a revision ('v3') or a dev bundle ('dev:{userId}'); there is no
// separate session-local preview layer anymore (see invariant #14, HANDOFF-NISHIDH.md).
// Keyed by the library's correlationId (stable across workspaces), not its workspace-scoped
// id — so a pin keeps resolving after the app is exported/imported into another workspace.
export const resolveEffectiveRevision = (
  pins: Record<string, Pin> | undefined,
  correlationId: string | undefined
): string | undefined => normalizePin(pins?.[dashlessId(correlationId) ?? ''] ?? pins?.[correlationId ?? '']);

// Reads a LibraryComponent instance's identity off its definition.properties — the only
// place it lives (never rendered as editable inspector fields). Shared by the Inspector
// panel and EventManager, which both need to resolve a manifest for an arbitrary
// component definition, not just the one currently mounted on the canvas.
export const getLibraryComponentIdentity = (component: ComponentDefinitionLike): ComponentIdentity => {
  const definitionProps = component.component?.definition?.properties ?? {};
  return {
    libraryId: definitionProps.libraryId?.value,
    correlationId: definitionProps.correlationId?.value,
    componentName: definitionProps.componentName?.value,
  };
};

// The Switch element labels options by `displayName`; select and the manifest use `name`.
const toSwitchOption = ({ name, value }: { name: string; value: string }) => ({ displayName: name, value });

// EventManager's action picker/param UI expects a normalized `handle` (not the manifest's
// `name`) on both the action and each param — this is the one place that shape gets
// produced, shared by anyone reading actions off a resolved manifest.
export const resolveManifestActions = (
  manifest: LibraryManifest | null | undefined,
  componentName: string | undefined
): ResolvedAction[] => {
  const actions: ManifestAction[] = (componentName && manifest?.components?.[componentName]?.actions) || [];
  return actions.map((a) => ({
    handle: a.name,
    displayName: a.displayName ?? a.name,
    params: (a.params ?? []).map((p) => ({
      handle: p.handle,
      displayName: p.displayName ?? p.handle,
      defaultValue: p.defaultValue,
      ...(p.type ? { type: p.type } : {}),
      ...(p.options ? { options: p.type === 'switch' ? p.options.map(toSwitchOption) : p.options } : {}),
    })),
  }));
};

// Dynamic (manifest) actions are appended after static ones (e.g. setVisibility), never
// replacing them.
export const mergeStaticAndDynamicActions = (
  staticActions: ResolvedAction[],
  dynamicActions: ResolvedAction[]
): ResolvedAction[] => [...staticActions, ...dynamicActions];

// Resolves a LibraryComponent's actions from the shared manifest cache for an arbitrary
// component definition — e.g. EventManager, which needs this for whatever component an
// event targets, not just the one it's currently rendering. Read-only: the manifest must
// already be in `manifests`; this returns [] rather than triggering a fetch itself.
export const resolveLibraryComponentActions = (
  componentDef: ComponentDefinitionLike,
  manifests: Record<string, LibraryManifest>,
  pins: Record<string, Pin> | undefined
): ResolvedAction[] => {
  const { libraryId, correlationId, componentName } = getLibraryComponentIdentity(componentDef);
  const revision = resolveEffectiveRevision(pins, correlationId);
  if (!libraryId || !revision) return [];
  const key = buildManifestCacheKey(libraryId, revision);
  return resolveManifestActions(manifests[key], componentName);
};
