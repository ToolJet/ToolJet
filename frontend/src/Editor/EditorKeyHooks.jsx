import React from 'react';
import useKeyHooks from '@/_hooks/useKeyHooks';

export const EditorKeyHooks = ({ moveComponents, handleEditorEscapeKeyPress, removeMultipleComponents }) => {
  const handleHotKeysCallback = (key) => {
    switch (key) {
      case 'Escape':
        handleEditorEscapeKeyPress();
        break;
      case 'Backspace':
        removeMultipleComponents();
        break;
      default:
        moveComponents(key);
    }
  };

  useKeyHooks(['up, down, left, right', 'esc', 'backspace'], handleHotKeysCallback);

  return <></>;
};
