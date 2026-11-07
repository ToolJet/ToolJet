import { useHotkeys } from 'react-hotkeys-hook';

const useKeyHooks = (hotkeys = [], callback, enabled = true) =>
  useHotkeys(
    hotkeys.toString(),
    (e) => {
      // Escape has no browser default to suppress, and overlays (ModalV2, Modal) read
      // `e.defaultPrevented` to tell whether a nested Radix layer already consumed it.
      if (e.key !== 'Escape') e.preventDefault();
      callback(e.code);
    },
    { enabled }
  );

export default useKeyHooks;
