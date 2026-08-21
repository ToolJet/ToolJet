import config from 'config';
import useStore from '@/AppBuilder/_stores/store';
import { useCustomComponentPreviewStore } from '@/_stores/customComponentPreviewStore';

export const pinKey = (libraryId) => libraryId?.replace(/-/g, '');
export const normalizePin = (pin) => (typeof pin === 'string' ? pin : pin?.revisionId ?? pin?.revision_id);

export const useEffectiveLibraryRevision = (libraryId, instanceRevisionId) => {
  const pin = useStore((state) => {
    const pins = state.globalSettings?.customComponentLibraries;
    return normalizePin(pins?.[pinKey(libraryId)] ?? pins?.[libraryId]);
  });
  const devPreview = useCustomComponentPreviewStore((state) => state.devPreviews?.[libraryId]);
  return devPreview ?? pin ?? instanceRevisionId;
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
