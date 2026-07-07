/**
 * Phase 3b wave 3 batch C contracts — Accordion, AudioRecorder, Camera, Image,
 * JSONEditor, JSONExplorer, ReorderableList, Tags, TagsInput, Tabs.
 *
 * Reducers replicate the per-instance CSA closures these widgets registered on
 * mount (Bucket B). Actions that must touch device/DOM or local render-only
 * state (MediaRecorder teardown, react-select selection objects, per-tab item
 * overrides) are Bucket C effectActions executed by the mounted widget.
 *
 * Widgets side-effect-import this module so registration happens before their
 * first csaShims() call (contractGroups has no barrel; contracts.ts is frozen).
 */
import { registerContract } from '../contracts';
import type { ComponentTypeContract, CsaReducer } from '../types';

/** Most old closures coerced with `!!value`. */
const coercedFlags: ComponentTypeContract['stateActions'] = {
  setVisibility: (_cur, [visible]) => ({ isVisible: !!visible }),
  setLoading: (_cur, [loading]) => ({ isLoading: !!loading }),
  setDisable: (_cur, [disabled]) => ({ isDisabled: !!disabled }),
};

/** AudioRecorder/Camera closures published the raw argument (no coercion). */
const rawVisibility: CsaReducer = (_cur, [value]) => ({ isVisible: value });
const rawLoading: CsaReducer = (_cur, [value]) => ({ isLoading: value });
const rawDisable: CsaReducer = (_cur, [value]) => ({ isDisabled: value });

/** The visibility/disabled/loading trio, `properties.visibility`/
 *  `disabledState`/`loadingState` — verified identical across every mediaC
 *  widget's own destructure + mount snapshot. Some types omit isLoading
 *  (Camera never had it) — callers spread this then delete/override. */
const deriveCoercedTrio = (properties: Record<string, unknown>) => ({
  isVisible: properties?.visibility,
  isDisabled: properties?.disabledState,
  isLoading: properties?.loadingState,
});

registerContract({
  type: 'Accordion',
  stateActions: {
    ...coercedFlags,
    // The onExpand/onCollapse events the old closures fired stay widget-side:
    // the widget's shim dispatches INVOKE_CSA + FIRE_EVENT together.
    expand: () => ({ isExpanded: true }),
    collapse: () => ({ isExpanded: false }),
  },
  // Old widget's mount snapshot always publishes isExpanded: true regardless
  // of any "expanded by default" property (Accordion.jsx mount effect).
  deriveExposed: (properties) => ({ ...deriveCoercedTrio(properties), isExpanded: true }),
});

registerContract({
  type: 'AudioRecorder',
  stateActions: { setVisibility: rawVisibility, setLoading: rawLoading, setDisable: rawDisable },
  // resetAudio stops the MediaRecorder stream and audio-element playback —
  // device state, so it executes on the mounted widget (which also nulls dataURL).
  effectActions: ['resetAudio'],
  deriveExposed: (properties) => deriveCoercedTrio(properties),
});

registerContract({
  type: 'Camera',
  stateActions: {
    setVisibility: rawVisibility,
    setDisable: rawDisable,
    // The old reset closures only nulled the exposed data URLs (no stream or
    // recorder teardown) — pure state, so they are reducers, not effects.
    resetVideo: () => ({ videoDataURL: null }),
    resetImage: () => ({ imageDataURL: null }),
  },
  // Camera never exposed isLoading (verified: its mount snapshot only
  // publishes isVisible/isDisabled) — omit it rather than publish undefined.
  deriveExposed: (properties) => ({ isVisible: properties?.visibility, isDisabled: properties?.disabledState }),
});

registerContract({
  type: 'Image',
  stateActions: {
    ...coercedFlags,
    setImageURL: (_cur, [value]) => ({ imageURL: value }),
    clearImage: () => ({ imageURL: '' }),
  },
  // Image.jsx's computeUrl(): imageFormat === 'imageUrl' ? source
  // : `data:${jsSchema?.type};base64,${jsSchema?.base64Data}` — verified
  // against the widget's own mount snapshot (Image.jsx:47-49, 135).
  deriveExposed: (properties) => ({
    ...deriveCoercedTrio(properties),
    alternativeText: properties?.alternativeText,
    imageURL:
      properties?.imageFormat === 'imageUrl'
        ? properties?.source
        : `data:${(properties?.jsSchema as { type?: string })?.type};base64,${
            (properties?.jsSchema as { base64Data?: string })?.base64Data
          }`,
  }),
});

registerContract({
  type: 'JSONEditor',
  stateActions: {
    ...coercedFlags,
    // Net effect of the old closure (JSONEditor.jsx old :270-278): objects
    // (incl. null) are exposed as-is with isValid true; anything else is
    // exposed raw with isValid false (the outer setExposedVariables always won).
    setValue: (_cur, [value]) => (typeof value === 'object' ? { value, isValid: true } : { value, isValid: false }),
  },
  deriveExposed: (properties) => deriveCoercedTrio(properties),
});

registerContract({
  type: 'JSONExplorer',
  stateActions: { ...coercedFlags, setValue: (_cur, [value]) => ({ value }) },
  deriveExposed: (properties) => deriveCoercedTrio(properties),
});

registerContract({ type: 'ReorderableList', stateActions: { ...coercedFlags }, deriveExposed: deriveCoercedTrio });

registerContract({ type: 'Tags', stateActions: { ...coercedFlags }, deriveExposed: deriveCoercedTrio });

registerContract({
  type: 'TagsInput',
  stateActions: { ...coercedFlags },
  // clear/selectTags/deselectTags mutate the react-select selection — local
  // option objects assembled from schema/options + session-created tags, plus
  // validate() folding — so they execute on the mounted widget.
  effectActions: ['clear', 'selectTags', 'deselectTags'],
  deriveExposed: deriveCoercedTrio,
});

registerContract({
  type: 'Tabs',
  stateActions: {
    ...coercedFlags,
    // Old closure no-oped when the tab was already active. Loose != on
    // purpose: CSA args may be strings while default ids are numeric indices.
    // eslint-disable-next-line eqeqeq
    setTab: (cur, [tabId]) => (cur.currentTab != tabId ? { currentTab: tabId } : {}),
  },
  // Per-tab disable/loading/visibility mutate the widget's local tabItems
  // copy, which resets whenever the tabs property re-resolves — keyed store
  // maps would outlive that reset, so these stay mounted-widget effects.
  effectActions: ['setTabDisable', 'setTabLoading', 'setTabVisibility'],
  // currentTab's real default (defaultTab / first tab id) depends on the
  // resolved `tabs`/`defaultTab` properties via widget-local logic not
  // captured here — omit it, matching Tabs.jsx's own mount snapshot which
  // relies on the same computation before publishing.
  deriveExposed: deriveCoercedTrio,
});
