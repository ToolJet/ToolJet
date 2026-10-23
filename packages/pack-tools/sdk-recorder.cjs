// Build-time stand-in for @tooljet/custom-component-sdk: rendering a pack component once with it records every hook
// call's options, in call order, which is the pack's manifest (what the closed `tooljet library` CLI generates).
// The state lives on globalThis: the build script bundles the components with their own copy of this module.
const box = (globalThis.__packRecorder = globalThis.__packRecorder || { calls: null });

const record = (kind, type) =>
  function recorded(options = {}, handler) {
    if (box.calls) box.calls.push({ kind, type, ...options, ...(kind === 'action' ? { hasHandler: !!handler } : {}) });
    if (kind === 'state') return [options.initialValue, () => {}];
    if (kind === 'style') return options.initialValue;
    if (kind === 'event') return () => {};
    return undefined;
  };

const ToolJet = {
  useStateString: record('state', 'string'),
  useStateNumber: record('state', 'number'),
  useStateBoolean: record('state', 'boolean'),
  useStateObject: record('state', 'object'),
  useStateArray: record('state', 'array'),
  useStateEnumeration: record('state', 'enumeration'),
  useStyleString: record('style', 'string'),
  useStyleNumber: record('style', 'number'),
  useStyleBoolean: record('style', 'boolean'),
  useStyleEnumeration: record('style', 'enumeration'),
  useEventCallback: record('event'),
  useAction: record('action'),
  useComponentSettings: record('settings'),
  // Host capabilities a ported component asks for (validation, control state, fitted height). Recorded so the
  // generated config gets the matching native sections.
  useValidation: (options = {}) => {
    if (box.calls) box.calls.push({ kind: 'validation', ...options });
    return { isValid: true, error: '' };
  },
  useControlState: () => {
    if (box.calls) box.calls.push({ kind: 'controlState' });
    return { disabled: false, loading: false };
  },
  useFieldId: () => 'field',
  useRows: () => {},
  Slot: (props) => {
    if (box.calls) box.calls.push({ kind: 'slot', name: props?.name });
    return null;
  },
  PopupSlot: (props) => {
    if (box.calls) box.calls.push({ kind: 'popupSlot', name: props?.name });
    return null;
  },
  RowSlot: (props) => {
    if (box.calls) box.calls.push({ kind: 'rowSlot', name: props?.name });
    return null;
  },
};

module.exports = {
  ToolJet,
  start: () => {
    box.calls = [];
  },
  stop: () => {
    const calls = box.calls;
    box.calls = null;
    return calls;
  },
};
