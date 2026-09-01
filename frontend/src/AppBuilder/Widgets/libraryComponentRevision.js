import config from 'config';
import useStore from '@/AppBuilder/_stores/store';

export const pinKey = (libraryId) => libraryId?.replace(/-/g, '');
export const normalizePin = (pin) => (typeof pin === 'string' ? pin : pin?.revisionId ?? pin?.revision_id);

// F5+: the pin IS the selection now — VersionPicker writes it immediately whether the
// chosen entry is a revision ('v3') or a dev bundle ('dev:{userId}'); there is no
// separate session-local preview layer anymore (see invariant #14, HANDOFF-NISHIDH.md).
// Keyed by the library's correlationId (stable across workspaces), not its workspace-scoped
// id — so a pin keeps resolving after the app is exported/imported into another workspace.
export const useEffectiveLibraryRevision = (correlationId, instanceRevisionId) => {
  const pin = useStore((state) => {
    const pins = state.globalSettings?.customComponentLibraries;
    return normalizePin(pins?.[pinKey(correlationId)] ?? pins?.[correlationId]);
  });
  return pin ?? instanceRevisionId;
};

// Builds bundle/css/manifest URLs for either a published revision ('v2') or a
// dev slot ('dev:{userId}' → the per-developer no-store endpoint).
export const libraryFileUrl = (libraryId, revision, file) =>
  revision?.startsWith?.('dev:')
    ? `${config.apiUrl}/custom-component-libraries/${libraryId}/dev/${revision.slice(4)}/files/${file}`
    : `${config.apiUrl}/custom-component-libraries/${libraryId}/revisions/${revision}/files/${file}`;

const instanceActions = new Map();

export const setLibraryComponentActions = (componentId, actions) => {
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

export const getLibraryComponentActions = (componentId) => instanceActions.get(componentId) ?? [];
