import { useEffect } from 'react';

// Disabled containers block the mouse via `data-disabled`/`pointer-events:none` but not the keyboard.
// `inert` removes the whole subtree from the tab order so the keyboard matches the mouse block.
export const useDisableInert = (ref, isDisabled) => {
  useEffect(() => {
    const node = ref?.current;
    if (node) node.inert = !!isDisabled;
  }, [ref, isDisabled]);
};
