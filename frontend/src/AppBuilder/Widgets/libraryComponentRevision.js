import config from 'config';
import useStore from '@/AppBuilder/_stores/store';
import { useCustomComponentPreviewStore } from '@/_stores/customComponentPreviewStore';

// F5: ONE resolution rule for which revision a LibraryComponent instance runs —
// shared by the runner and the Inspector so they can never disagree.
//
//   1. dev preview override (local session only — never persisted, absent in viewer)
//   2. app-level pin: globalSettings.customComponentLibraries[libraryId].revisionId
//      (LLD §5.7 — every instance of a library in an app version moves together)
//   3. the instance's own revisionId property (back-compat: pre-F5 instances)
// Pins are stored as FLAT STRINGS ({ [libraryId]: 'v1' }) on purpose: the app-load
// response runs the whole payload through humps' DEEP decamelizeKeys (apps
// service), which would rename a nested `revisionId` key to `revision_id` in
// transit — while deep-camelizing on load would corrupt the UUID map keys. A
// string value has no keys to mangle. normalizePin tolerates rows saved in the
// short-lived object shape ({revisionId}/{revision_id}).
export const normalizePin = (pin) => (typeof pin === 'string' ? pin : pin?.revisionId ?? pin?.revision_id);

export const useEffectiveLibraryRevision = (libraryId, instanceRevisionId) => {
  const pin = useStore((state) => normalizePin(state.globalSettings?.customComponentLibraries?.[libraryId]));
  const devPreview = useCustomComponentPreviewStore((state) => state.devPreviews?.[libraryId]);
  return devPreview ?? pin ?? instanceRevisionId;
};

// Builds bundle/css/manifest URLs for either a published revision ('v2') or a
// dev slot ('dev:{userId}' → the per-developer no-store endpoint).
export const libraryFileUrl = (libraryId, revision, file) =>
  revision?.startsWith?.('dev:')
    ? `${config.apiUrl}/custom-component-libraries/${libraryId}/dev/${revision.slice(4)}/files/${file}`
    : `${config.apiUrl}/custom-component-libraries/${libraryId}/revisions/${revision}/files/${file}`;
