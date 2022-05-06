import React from 'react';
import useKeyHooks from '@/_hooks/useKeyHooks';

export const EditorKeyHooks = ({ moveComponents, handleEditorEscapeKeyPress }) => {
  const handleHotKeysCallback = (key) => {
    switch (key) {
      case 'Escape':
        handleEditorEscapeKeyPress();
        break;

      default:
        moveComponents(key);
    }
  };

  useKeyHooks(['up, down, left, right', 'esc'], handleHotKeysCallback);

  return <></>;
};
