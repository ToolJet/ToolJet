import React, { useRef, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import useStore from '@/AppBuilder/_stores/store';
import { pasteComponents, copyComponents } from './appCanvasUtils';
import useKeyHooks from '@/_hooks/useKeyHooks';
import { shallow } from 'zustand/shallow';

export const HotkeyProvider = ({ children, mode, currentLayout, canvasMaxWidth }) => {
  const canvasRef = useRef(null);
  const focusedParentIdRef = useRef(undefined);
  const handleUndo = useStore((state) => state.handleUndo);
  const handleRedo = useStore((state) => state.handleRedo);
  const setWidgetDeleteConfirmation = useStore((state) => state.setWidgetDeleteConfirmation);
  const moveComponentPosition = useStore((state) => state.moveComponentPosition, shallow);
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
  const enableReleasedVersionPopupState = useStore((state) => state.enableReleasedVersionPopupState, shallow);
  const clearSelectedComponents = useStore((state) => state.clearSelectedComponents, shallow);
  const getSelectedComponents = useStore((state) => state.getSelectedComponents, shallow);
  const setSelectedComponents = useStore((state) => state.setSelectedComponents, shallow);
  const lastCanvasIdClick = useStore((state) => state.lastCanvasIdClick, shallow);
  const containerChildrenMapping = useStore((state) => state.containerChildrenMapping, shallow);

  useHotkeys('meta+z, control+z', handleUndo, { enabled: mode === 'edit' });
  useHotkeys('meta+shift+z, control+shift+z', handleRedo, { enabled: mode === 'edit' });

  const paste = async () => {
    if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      try {
        const cliptext = await navigator.clipboard.readText();
        pasteComponents(focusedParentIdRef.current, JSON.parse(cliptext));
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
    setSelectedComponents(containerChildrenMapping?.[lastCanvasIdClick || 'canvas']);
  };

  useEffect(() => {
    const handleClick = (e) => {
      const modalContainer = document.getElementById('modal-container');
      // Check if the click is within the canvas or modal
      const isCanvasOrModalClick =
        canvasRef.current?.contains(e.target) && modalContainer?.contains(e.target) !== false;

      if (isCanvasOrModalClick) {
        // If clicked anywhere in Modal, following condition plays
        if (modalContainer?.contains(e.target) === true) {
          const canvasId = modalContainer?.getAttribute('component-id');
          focusedParentIdRef.current = canvasId;
        } else {
          // Find the closest .real-canvas element and get its id
          const realCanvas = e.target.closest('.real-canvas');
          const canvasId = realCanvas?.getAttribute('id');

          // Set the focusedParentId based on the canvas id
          focusedParentIdRef.current = canvasId === 'real-canvas' ? undefined : canvasId?.split('canvas-')[1];
        }
      }
    };

    // Add click event listener to the document
    document.addEventListener('click', handleClick);

    // Cleanup function to remove the event listener
    return () => document.removeEventListener('click', handleClick);
  }, [canvasRef]);

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
        margin: '0 auto',
        transform: 'translateZ(0)',
      }}
    >
      {children}
    </div>
  );
};
