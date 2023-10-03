import React from 'react';
import cx from 'classnames';
import { Tooltip } from 'react-tooltip';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import SolidIcon from '@/_ui/Icon/SolidIcons';

function HeaderActions({ handleUndo, canUndo, handleRedo, canRedo }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { currentLayout, toggleCurrentLayout } = useEditorStore(
    (state) => ({
      currentLayout: state.currentLayout,
      toggleCurrentLayout: state.actions.toggleCurrentLayout,
    }),
    shallow
  );
  return (
    <div className="editor-header-actions">
      <div style={{ borderRadius: 6 }}>
        <div
          className="d-flex align-items-center p-1 current-layout"
          style={{ height: 28, background: darkMode ? '#202425' : '#F1F3F5', borderRadius: 6 }}
          role="tablist"
          aria-orientation="horizontal"
        >
          <button
            className={cx('btn border-0 p-1', {
              'bg-transparent': currentLayout !== 'desktop',
              'bg-white': currentLayout === 'desktop',
              'opacity-100': currentLayout === 'desktop',
            })}
            style={{ height: 20 }}
            role="tab"
            type="button"
            aria-selected="true"
            tabIndex="0"
            onClick={() => toggleCurrentLayout('desktop')}
            data-cy={`button-change-layout-to-desktop`}
          >
            <SolidIcon
              name="computer"
              width="14"
              fill={currentLayout === 'desktop' ? 'var(--slate12)' : 'var(--button-tirtiary-icon)'}
            />
          </button>
          <button
            className={cx('btn border-0 p-1', {
              'bg-transparent': currentLayout !== 'mobile',
              'bg-white': currentLayout === 'mobile',
              'opacity-100': currentLayout === 'mobile',
            })}
            role="tab"
            type="button"
            style={{ height: 20 }}
            aria-selected="false"
            tabIndex="-1"
            onClick={() => toggleCurrentLayout('mobile')}
            data-cy={`button-change-layout-to-mobile`}
          >
            <SolidIcon
              name="mobile"
              width="14"
              fill={currentLayout !== 'desktop' ? 'var(--slate12)' : 'var(--button-tirtiary-icon)'}
            />
          </button>
        </div>
      </div>
      <div className="undo-redo-container">
        <div
          onClick={handleUndo}
          className="tj-ghost-black-btn"
          data-tooltip-id="tooltip-for-undo"
          data-tooltip-content="Undo"
          data-cy={`editor-undo-button`}
        >
          <SolidIcon
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill={darkMode ? '#fff' : '#2c3e50'}
            name="arrowforwardup"
            className={cx('cursor-pointer', {
              disabled: !canUndo,
            })}
          />
        </div>
        <div
          onClick={handleRedo}
          className="tj-ghost-black-btn"
          data-tooltip-id="tooltip-for-redo"
          data-tooltip-content="Redo"
          data-cy={`editor-redo-button`}
        >
          <SolidIcon
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill={darkMode ? '#fff' : '#2c3e50'}
            name="arrowbackup"
            className={cx('cursor-pointer', {
              disabled: !canRedo,
            })}
          />
        </div>
      </div>
      <Tooltip id="tooltip-for-undo" className="tooltip" />
      <Tooltip id="tooltip-for-redo" className="tooltip" />
    </div>
  );
}

export default HeaderActions;
