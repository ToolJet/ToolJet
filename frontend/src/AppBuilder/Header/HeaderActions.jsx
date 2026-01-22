import React, { useMemo, useCallback } from 'react';
import cx from 'classnames';
import { Tooltip } from 'react-tooltip';
import { shallow } from 'zustand/shallow';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import useStore from '@/AppBuilder/_stores/store';
import { Monitor, Smartphone, Play } from 'lucide-react';
import { ToggleLayoutButtons } from './ToggleLayoutButtons';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import { usePreviewToggleAnimation } from '@/AppBuilder/_hooks/usePreviewToggleAnimation';

const HeaderActions = function HeaderActions({ moduleId, darkMode, showFullWidth, showPreviewBtn = true }) {
  const {
    currentLayout,
    canUndo,
    canRedo,
    toggleCurrentLayout,
    handleUndo,
    handleRedo,
    showToggleLayoutBtn,
    showUndoRedoBtn,
    clearSelectedComponents,
    currentMode,
    toggleCurrentMode,
  } = useStore(
    (state) => ({
      currentLayout: state.currentLayout,
      canUndo: state.canUndo && !(state.isEditorFreezed || state.isVersionReleased),
      canRedo: state.canRedo && !(state.isEditorFreezed || state.isVersionReleased),
      toggleCurrentLayout: state.toggleCurrentLayout,
      showToggleLayoutBtn: state.showToggleLayoutBtn,
      showUndoRedoBtn: state.showUndoRedoBtn,
      handleUndo: state.handleUndo,
      handleRedo: state.handleRedo,
      clearSelectedComponents: state.clearSelectedComponents,
      currentMode: state.modeStore.modules[moduleId]?.currentMode,
      toggleCurrentMode: state.toggleCurrentMode,
    }),
    shallow
  );

  const { isAnimating, setIsAnimating } = usePreviewToggleAnimation();

  const clearSelectionBorder = useCallback(() => {
    clearSelectedComponents();
    const selectedElems = document.getElementsByClassName('active-target');
    for (const element of selectedElems) {
      element.classList.remove('active-target');
    }
  }, [clearSelectedComponents]);

  return (
    <div
      className={cx('tw-flex tw-gap-2 tw-items-center tw-justify-center editor-header-actions', {
        'w-100': showFullWidth,
      })}
      data-cy="header-actions"
    >
      {showToggleLayoutBtn && (
        <ToggleLayoutButtons
          currentLayout={currentLayout}
          toggleCurrentLayout={toggleCurrentLayout}
          clearSelectionBorder={clearSelectionBorder}
          showFullWidth={showFullWidth}
          darkMode={darkMode}
        />
      )}
      {showPreviewBtn && (
        <ButtonComponent
          isLucid
          size="default"
          variant="outline"
          leadingIcon={currentMode === 'edit' ? 'play' : 'square-pen'}
          data-cy="preview-link-button"
          style={{ width: currentMode === 'edit' ? '92px' : '70px', padding: '7px 12px' }}
          onClick={() => {
            setIsAnimating(true); // Show preview loading as soon as the user clicks the button
            toggleCurrentMode(moduleId);
          }}
          className={'tw-transition-[width] tw-duration-300 tw-ease-linear'}
          isLoading={isAnimating}
          disabled={isAnimating}
        >
          {currentMode === 'edit' ? 'Preview' : 'Edit'}
        </ButtonComponent>
      )}

      <Tooltip id="tooltip-for-undo" className="tooltip" data-cy="undo-tooltip" />
      <Tooltip id="tooltip-for-redo" className="tooltip" data-cy="redo-tooltip" />
    </div>
  );
};

export default HeaderActions;
