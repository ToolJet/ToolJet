import { useHotkeys } from 'react-hotkeys-hook';

const useKeyHooks = (hotkeys = [], callback, enabled = true) =>
  useHotkeys(
    hotkeys.toString(),
    (e) => {
      e.preventDefault();
      callback(e.code);
    },
    { enabled }
  );

export default useKeyHooks;
