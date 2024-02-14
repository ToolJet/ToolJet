import React, { useEffect, useMemo } from 'react';
import cx from 'classnames';
import { Tooltip } from 'react-tooltip';
import { useEditorStore } from '@/_stores/editorStore';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import { shallow } from 'zustand/shallow';
import SolidIcon from '@/_ui/Icon/SolidIcons';

function HeaderActions({ handleUndo, canUndo, handleRedo, canRedo }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const currentState = useCurrentState();
  const { currentLayout, toggleCurrentLayout, appDefinition, currentPageId } = useEditorStore(
    (state) => ({
      currentLayout: state.currentLayout,
      toggleCurrentLayout: state.actions.toggleCurrentLayout,
      appDefinition: state.appDefinition,
      currentPageId: state.currentPageId,
    }),
    shallow
  );
  const components = useMemo(
    () => appDefinition.pages[currentPageId]?.components ?? {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(appDefinition), currentPageId]
  );
  useEffect(() => {
    Object.keys(components).map((key) => {
      const box = components[key];
      const syncValues = {
        position: resolveWidgetFieldValue(box?.component.definition.others.positionSync, currentState)?.value,
        size: resolveWidgetFieldValue(box?.component.definition.others.dimensionSync, currentState)?.value,
      };
      if (syncValues.position || syncValues.size) {
        const oldLayout = currentLayout === 'desktop' ? 'mobile' : 'desktop';
        if (syncValues.position) {
          box.layouts[currentLayout].top = box.layouts[oldLayout].top;
          box.layouts[currentLayout].left = box.layouts[oldLayout].left;
        }
        if (syncValues.size) {
          box.layouts[currentLayout].width = box.layouts[oldLayout].width;
          box.layouts[currentLayout].height = box.layouts[oldLayout].height;
        }
      }
    });
  }, [currentLayout]);
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
              fill={currentLayout === 'desktop' ? 'var(--slate12)' : 'var(--slate8)'}
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
              fill={currentLayout !== 'desktop' ? 'var(--slate12)' : 'var(--slate8)'}
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
