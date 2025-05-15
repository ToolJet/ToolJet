import React, { useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import useStore from '@/AppBuilder/_stores/store';
import { pasteComponents, copyComponents } from './appCanvasUtils';
import useKeyHooks from '@/_hooks/useKeyHooks';
import { shallow } from 'zustand/shallow';

export const HotkeyProvider = ({ children, mode, currentLayout, canvasMaxWidth }) => {
  const canvasRef = useRef(null);
  const focusedParentId = useStore((state) => state.focusedParentId, shallow);
  const handleUndo = useStore((state) => state.handleUndo);
  const handleRedo = useStore((state) => state.handleRedo);
  const setWidgetDeleteConfirmation = useStore((state) => state.setWidgetDeleteConfirmation);
  const moveComponentPosition = useStore((state) => state.moveComponentPosition, shallow);
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
  const enableReleasedVersionPopupState = useStore((state) => state.enableReleasedVersionPopupState, shallow);
  const clearSelectedComponents = useStore((state) => state.clearSelectedComponents, shallow);
  const getSelectedComponents = useStore((state) => state.getSelectedComponents, shallow);
  const setSelectedComponents = useStore((state) => state.setSelectedComponents, shallow);
  const containerChildrenMapping = useStore((state) => state.containerChildrenMapping, shallow);
  useHotkeys('meta+z, control+z', handleUndo, { enabled: mode === 'edit' });
  useHotkeys('meta+shift+z, control+shift+z', handleRedo, { enabled: mode === 'edit' });

  const paste = async () => {
    if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      try {
        const cliptext = await navigator.clipboard.readText();
        pasteComponents(focusedParentId, JSON.parse(cliptext));
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log('Clipboard API is not available in this browser.');
    }
  };

  const handleEscapeKeyPress = () => {
    clearSelectedComponents();
    const selectedComponents = getSelectedComponents();
    if (selectedComponents.length > 1) {
      selectedComponents.forEach((componentId) => {
        const widgets = document.getElementsByClassName(`widget-${componentId}`)?.[0];
        widgets?.classList?.remove('active-target');
      });
    }
  };

  const deleteComponents = () => {
    const selectedComponents = getSelectedComponents();
    if (selectedComponents.length > 0) {
      setWidgetDeleteConfirmation(true);
    }
  };

  const handleSelectAll = () => {
    setSelectedComponents(containerChildrenMapping?.[focusedParentId || 'canvas']);
  };

  const handleHotKeysCallback = (key) => {
    if (shouldFreeze) {
      enableReleasedVersionPopupState();
      return;
    }
    switch (key) {
      case 'Escape':
        handleEscapeKeyPress(); // clears the selected components
        break;
      case 'Backspace':
        deleteComponents(); // Delete opration -> First asks for a Confirmation
        break;
      case 'KeyD':
        copyComponents({ isCloning: true }); // Clone/Duplicate operation
        break;
      case 'KeyC':
        copyComponents({ isCut: false }); // Copy operation
        break;
      case 'KeyX':
        copyComponents({ isCut: true }); // Cut operation
        break;
      case 'KeyV':
        paste(); // Paste operation
        break;
      case 'KeyA':
        handleSelectAll();
        break;
      default:
        moveComponentPosition(key, currentLayout);
    }
  };

  useKeyHooks(
    [
      'up, down, left, right',
      'esc',
      'backspace',
      'meta+d, ctrl+d, meta+c, ctrl+c, meta+x, ctrl+x',
      'meta+v',
      'control+v',
      'meta+a, ctrl+a',
    ],
    handleHotKeysCallback,
    mode === 'edit'
  );

  return (
    <div
      ref={(el) => {
        if (mode === 'edit') {
          canvasRef.current = el;
        }
      }}
      tabIndex={-1}
      style={{
        width: currentLayout == 'mobile' ? '450px' : '100%',
        maxWidth: canvasMaxWidth,
        margin: '0px',
        transform: 'translateZ(0)',
      }}
    >
      {children}
    </div>
  );
};
