import { useHotkeys } from 'react-hotkeys-hook';

const useKeyHooks = (hotkeys = [], callback) =>
  useHotkeys(hotkeys.toString(), (e) => {
    e.preventDefault();
    callback(e.code);
  });

export default useKeyHooks;
