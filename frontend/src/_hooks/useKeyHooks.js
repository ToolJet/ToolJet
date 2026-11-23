import { useHotkeys } from 'react-hotkeys-hook';

// Shadow DOM retargets event.target to the host, so the library's input check misses keys typed in pack UI.
export const isFromShadowTree = (e) => {
  const origin = e.composedPath?.()[0];
  return Boolean(origin && origin !== e.target && origin.getRootNode?.() instanceof ShadowRoot);
};

const useKeyHooks = (hotkeys = [], callback, enabled = true) =>
  useHotkeys(
    hotkeys.toString(),
    (e) => {
      // Escape has no browser default to suppress, and overlays (ModalV2, Modal) read
      // `e.defaultPrevented` to tell whether a nested Radix layer already consumed it.
      if (e.key !== 'Escape') e.preventDefault();
      callback(e.code);
    },
    { enabled, ignoreEventWhen: isFromShadowTree }
  );

export default useKeyHooks;
