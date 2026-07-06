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

registerContract({
  type: 'Accordion',
  stateActions: {
    ...coercedFlags,
    // The onExpand/onCollapse events the old closures fired stay widget-side:
    // the widget's shim dispatches INVOKE_CSA + FIRE_EVENT together.
    expand: () => ({ isExpanded: true }),
    collapse: () => ({ isExpanded: false }),
  },
});

registerContract({
  type: 'AudioRecorder',
  stateActions: { setVisibility: rawVisibility, setLoading: rawLoading, setDisable: rawDisable },
  // resetAudio stops the MediaRecorder stream and audio-element playback —
  // device state, so it executes on the mounted widget (which also nulls dataURL).
  effectActions: ['resetAudio'],
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
});

registerContract({
  type: 'Image',
  stateActions: {
    ...coercedFlags,
    setImageURL: (_cur, [value]) => ({ imageURL: value }),
    clearImage: () => ({ imageURL: '' }),
  },
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
});

registerContract({
  type: 'JSONExplorer',
  stateActions: { ...coercedFlags, setValue: (_cur, [value]) => ({ value }) },
});

registerContract({ type: 'ReorderableList', stateActions: { ...coercedFlags } });

registerContract({ type: 'Tags', stateActions: { ...coercedFlags } });

registerContract({
  type: 'TagsInput',
  stateActions: { ...coercedFlags },
  // clear/selectTags/deselectTags mutate the react-select selection — local
  // option objects assembled from schema/options + session-created tags, plus
  // validate() folding — so they execute on the mounted widget.
  effectActions: ['clear', 'selectTags', 'deselectTags'],
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
});
