import React from 'react';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';

import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import useStore from '@/AppBuilder/_stores/store';
import useAppDarkMode from '@/_hooks/useAppDarkMode';
import { CONTAINER_FORM_CANVAS_PADDING, PAGE_CANVAS_FOOTER_HEIGHT } from '../appCanvasConstants';
import { Container } from '../Container';
import ConfigHandleButton from '@/_components/ConfigHandleButton';

export const PageCanvasFooter = ({ showCanvasFooter, isMobileLayout, currentMode }) => {
  const { moduleId } = useModuleContext();
  const currentPageId = useStore((state) => state.modules[moduleId].currentPageId);
  const selectedVersion = useStore((state) => state.selectedVersion, shallow);
  const isMobilePreviewMode = selectedVersion?.id && isMobileLayout && currentMode === 'view';

  const footerBackgroundColor = useStore(
    (state) => state.modules[moduleId].pages.find((p) => p.id === currentPageId)?.pageFooter?.backgroundColor,
    shallow
  );
  const footerBorderColor = useStore(
    (state) => state.modules[moduleId].pages.find((p) => p.id === currentPageId)?.pageFooter?.borderColor,
    shallow
  );

  const setCanvasFooterSelected = useStore((state) => state.setCanvasFooterSelected, shallow);
  const isCanvasFooterSelected = useStore((state) => state.isCanvasFooterSelected, shallow);
  const clearSelectedComponents = useStore((state) => state.clearSelectedComponents, shallow);

  const { isAppDarkMode } = useAppDarkMode();

  if (!showCanvasFooter) return null;

  return (
    <div
      className={cx('canvas-footer-slot', {
        '!tw-w-[450px] tw-mx-auto': isMobileLayout && (currentMode === 'edit' || isMobilePreviewMode),
        'canvas-footer-slot--edit': currentMode === 'edit',
        'canvas-footer-slot--selected': isCanvasFooterSelected,
      })}
      component-id="canvas-footer"
      onClick={(e) => {
        if (currentMode === 'edit') {
          e.stopPropagation();
          clearSelectedComponents();
          setCanvasFooterSelected(true);
        }
      }}
      style={{
        position: 'sticky',
        bottom: 'var(--preview-header-height, 0px)',
        zIndex: 10,
        flexShrink: 0,
        padding: `${CONTAINER_FORM_CANVAS_PADDING}px`,
        height: `${PAGE_CANVAS_FOOTER_HEIGHT}px`,
        border: `1px solid ${
          isCanvasFooterSelected ? 'var(--border-accent-strong)' : footerBorderColor ?? 'var(--cc-default-border)'
        }`,
        backgroundColor: footerBackgroundColor ?? (isAppDarkMode ? '#232E3C' : '#fff'),
        width: '100%',
      }}
    >
      {currentMode === 'edit' && (
        <div className="canvas-footer-tooltip">
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
            <span style={{ cursor: 'default' }}>App footer</span>
          </ConfigHandleButton>
        </div>
      )}
      <Container
        id={`${moduleId}-footer`}
        canvasHeight={PAGE_CANVAS_FOOTER_HEIGHT / 10}
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
