import React from 'react';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';

import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import useStore from '@/AppBuilder/_stores/store';
import useAppDarkMode from '@/_hooks/useAppDarkMode';
import { CONTAINER_FORM_CANVAS_PADDING, PAGE_CANVAS_HEADER_HEIGHT } from './appCanvasConstants';
import { Container } from './Container';
import ConfigHandleButton from '@/_components/ConfigHandleButton';

export const PageCanvasHeader = ({ showCanvasHeader, isMobileLayout, currentMode }) => {
  const { moduleId } = useModuleContext();
  const currentPageId = useStore((state) => state.modules[moduleId].currentPageId);
  const selectedVersion = useStore((state) => state.selectedVersion, shallow);
  const isMobilePreviewMode = selectedVersion?.id && isMobileLayout && currentMode === 'view';

  const headerBackgroundColor = useStore(
    (state) => state.modules[moduleId].pages.find((p) => p.id === currentPageId)?.pageHeader?.backgroundColor,
    shallow
  );
  const headerBorderColor = useStore(
    (state) => state.modules[moduleId].pages.find((p) => p.id === currentPageId)?.pageHeader?.borderColor,
    shallow
  );

  const setCanvasHeaderSelected = useStore((state) => state.setCanvasHeaderSelected, shallow);
  const isCanvasHeaderSelected = useStore((state) => state.isCanvasHeaderSelected, shallow);
  const clearSelectedComponents = useStore((state) => state.clearSelectedComponents, shallow);

  const { isAppDarkMode } = useAppDarkMode();

  if (!showCanvasHeader) return null;

  return (
    <div
      className={cx('canvas-header-slot', {
        '!tw-w-[450px] tw-mx-auto': isMobileLayout && (currentMode === 'edit' || isMobilePreviewMode),
        'canvas-header-slot--edit': currentMode === 'edit',
        'canvas-header-slot--selected': isCanvasHeaderSelected,
      })}
      component-id="canvas-header"
      onClick={(e) => {
        if (currentMode === 'edit') {
          e.stopPropagation();
          clearSelectedComponents();
          setCanvasHeaderSelected(true);
        }
      }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
        padding: `${CONTAINER_FORM_CANVAS_PADDING}px`,
        height: `${PAGE_CANVAS_HEADER_HEIGHT}px`,
        border: `1px solid ${
          isCanvasHeaderSelected ? 'var(--border-accent-strong)' : headerBorderColor ?? 'var(--cc-default-border)'
        }`,
        backgroundColor: headerBackgroundColor ?? (isAppDarkMode ? '#232E3C' : '#fff'),
        width: '100%',
      }}
    >
      {currentMode === 'edit' && (
        <div className="canvas-header-tooltip">
          <ConfigHandleButton
            className="no-hover"
            customStyles={{
              alignItems: 'center',
              gap: '6px',
              padding: '4px 6px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ cursor: 'default' }}>App header</span>
          </ConfigHandleButton>
        </div>
      )}
      <Container
        id={`${moduleId}-header`}
        canvasHeight={PAGE_CANVAS_HEADER_HEIGHT / 10}
        canvasWidth={window.innerWidth}
        darkMode={isAppDarkMode}
        allowContainerSelect={false}
        styles={{
          margin: 0,
          backgroundColor: 'transparent',
          overflow: 'hidden',
        }}
        componentType="AppCanvas"
        hasNoScroll={true}
      />
    </div>
  );
};
