import React, { useMemo, useCallback } from 'react';
import cx from 'classnames';
import { Tooltip } from 'react-tooltip';
import { shallow } from 'zustand/shallow';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import useStore from '@/AppBuilder/_stores/store';
import { Button } from '@/components/ui/Button/Button';
import { Monitor, Smartphone, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppPreviewLink } from '@/_hooks/useAppPreviewLink';
import { ToggleLayoutButtons } from './ToggleLayoutButtons';

const HeaderActions = function HeaderActions({ darkMode, showFullWidth }) {
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
    }),
    shallow
  );
  const clearSelectionBorder = useCallback(() => {
    clearSelectedComponents();
    const selectedElems = document.getElementsByClassName('active-target');
    for (const element of selectedElems) {
      element.classList.remove('active-target');
    }
  }, [clearSelectedComponents]);
  const appPreviewLink = useAppPreviewLink();
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
      <Link
        title="Preview"
        to={appPreviewLink}
        target="_blank"
        rel="noreferrer"
        data-cy="preview-link-button"
        className="preview-link-btn"
      >
        <Play width="16" height="16" />
        Preview
      </Link>
      <Tooltip id="tooltip-for-undo" className="tooltip" data-cy="undo-tooltip" />
      <Tooltip id="tooltip-for-redo" className="tooltip" data-cy="redo-tooltip" />
    </div>
  );
};

export default HeaderActions;
