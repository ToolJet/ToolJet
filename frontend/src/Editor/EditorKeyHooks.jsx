import React from 'react';
import useKeyHooks from '@/_hooks/useKeyHooks';

export const EditorKeyHooks = ({
  moveComponents,
  copyComponents,
  cutComponents,
  cloneComponents,
  handleEditorEscapeKeyPress,
  removeMultipleComponents,
}) => {
  const handleHotKeysCallback = (key) => {
    switch (key) {
      case 'Escape':
        handleEditorEscapeKeyPress();
        break;
      case 'Backspace':
        removeMultipleComponents();
        break;
      case 'KeyD':
        cloneComponents();
        break;
      case 'KeyC':
        copyComponents();
        break;
      case 'KeyX':
        cutComponents();
        break;
      default:
        moveComponents(key);
    }
  };

  useKeyHooks(
    ['up, down, left, right', 'esc', 'backspace', 'cmd+d, ctrl+d, cmd+c, ctrl+c, cmd+x, ctrl+x'],
    handleHotKeysCallback
  );

  return <></>;
};
