import config from 'config';
import useStore from '@/AppBuilder/_stores/store';

import type { ManifestAction } from '@/AppBuilder/types/libraryComponent.types';

export type Pin = string | { revisionId?: string; revision_id?: string } | undefined | null;

interface ResolvedActionParam {
  handle: string;
  displayName: string;
  defaultValue?: unknown;
  type?: string;
  options?: unknown;
}

interface ResolvedAction {
  handle: string;
  displayName: string;
  params: ResolvedActionParam[];
}

// Every call site passes a correlationId (pins are keyed by dashless correlationId,
// never by libraryId — see useEffectiveLibraryRevision below), so this takes a generic
// id rather than implying it's library-specific.
export const dashlessId = (id: string | undefined): string | undefined => id?.replace(/-/g, '');

export const normalizePin = (pin: Pin): string | undefined =>
  typeof pin === 'string' ? pin : pin?.revisionId ?? pin?.revision_id;

// F5+: the pin IS the selection now — VersionPicker writes it immediately whether the
// chosen entry is a revision ('v3') or a dev bundle ('dev:{userId}'); there is no
// separate session-local preview layer anymore (see invariant #14, HANDOFF-NISHIDH.md).
// Keyed by the library's correlationId (stable across workspaces), not its workspace-scoped
// id — so a pin keeps resolving after the app is exported/imported into another workspace.
export const useEffectiveLibraryRevision = (correlationId: string | undefined): string | undefined =>
  useStore((state: any) => {
    const pins: Record<string, Pin> | undefined = state.globalSettings?.customComponentLibraries;
    return normalizePin(pins?.[dashlessId(correlationId) ?? ''] ?? pins?.[correlationId ?? '']);
  });

// Builds bundle/css/manifest URLs for either a published revision ('v2') or a
// dev slot ('dev:{userId}' → the per-developer no-store endpoint).
export const libraryFileUrl = (libraryId: string, revision: string | undefined, file: string): string =>
  revision?.startsWith?.('dev:')
    ? `${config.apiUrl}/custom-component-libraries/${libraryId}/dev/${revision.slice(4)}/files/${file}`
    : `${config.apiUrl}/custom-component-libraries/${libraryId}/revisions/${revision}/files/${file}`;

const instanceActions = new Map<string, ResolvedAction[]>();

export const setLibraryComponentActions = (componentId: string, actions: ManifestAction[] | null | undefined) => {
  if (!actions?.length) {
    instanceActions.delete(componentId);
    return;
  }
  instanceActions.set(
    componentId,
    actions.map((a) => ({
      handle: a.name,
      displayName: a.displayName ?? a.name,
      params: (a.params ?? []).map((p) => ({
        handle: p.handle,
        displayName: p.displayName ?? p.handle,
        defaultValue: p.defaultValue,
        ...(p.type ? { type: p.type } : {}),
        ...(p.options ? { options: p.options } : {}),
      })),
    }))
  );
};

export const getLibraryComponentActions = (componentId: string): ResolvedAction[] =>
  instanceActions.get(componentId) ?? [];
