import React, { useState, useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import ColorSwatches from '@/modules/Appbuilder/components/ColorSwatches';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { PAGE_CANVAS_FOOTER_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { NumberInput } from '@/AppBuilder/CodeBuilder/Elements/NumberInput';
import { Button } from '@/components/ui/Button/Button';

const AppFooterStylesPanel = () => {
  const { moduleId } = useModuleContext();
  const setCanvasFooterSelected = useStore((state) => state.setCanvasFooterSelected, shallow);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen, shallow);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab, shallow);
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned);
  const currentPageId = useStore((state) => state.modules[moduleId].currentPageId);
  const updatePageFooterStyle = useStore((state) => state.updatePageFooterStyle, shallow);
  const footerBackgroundColor = useStore(
    (state) =>
      state.modules[moduleId].pages.find((p) => p.id === currentPageId)?.pageFooter?.backgroundColor ||
      'var(--cc-surface1-surface)',
    shallow
  );
  const footerBorderColor = useStore(
    (state) =>
      state.modules[moduleId].pages.find((p) => p.id === currentPageId)?.pageFooter?.borderColor ||
      'var(--cc-weak-border)',
    shallow
  );
  const footerHeight = useStore(
    (state) =>
      state.modules[moduleId].pages.find((p) => p.id === currentPageId)?.pageFooter?.height ??
      PAGE_CANVAS_FOOTER_HEIGHT,
    shallow
  );

  const [inputValue, setInputValue] = useState(footerHeight);

  useEffect(() => {
    setInputValue(footerHeight);
  }, [footerHeight]);

  const roundToNearest10 = (val) => Math.max(10, Math.round(Number(val) / 10) * 10);

  const handleClose = () => {
    setCanvasFooterSelected(false);
    setActiveRightSideBarTab(null);
    if (!isRightSidebarPinned) {
      setRightSidebarOpen(false);
    }
  };

  return (
    <>
      <div className="tw-flex tw-p-4 tw-items-center tw-justify-between tw-border-b tw-border-t-0 tw-border-l-0 tw-border-r-0 tw-border-solid tw-border-[color:var(--border-weak)]">
        <div
          className="tw-font-medium tw-leading-[18px] tw-px-[6px] tw-py-[5px]"
          style={{ color: 'var(--text-default)' }}
        >
          App footer
        </div>
        <Button
          iconOnly
          leadingIcon="x"
          onClick={handleClose}
          variant="ghost"
          size="medium"
          isLucid={true}
          data-cy="pages-close-button"
        />
      </div>
      <div className="tw-p-[16px] tj-text-xsm color-slate12">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="field">
            <OverflowTooltip style={{ width: '120px' }} childrenClassName="tj-text-xsm color-slate12 mb-2">
              Background
            </OverflowTooltip>
          </div>
          <ColorSwatches
            value={footerBackgroundColor}
            onChange={(value) => updatePageFooterStyle(currentPageId, 'backgroundColor', value)}
          />
        </div>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="field">
            <OverflowTooltip style={{ width: '120px' }} childrenClassName="tj-text-xsm color-slate12 mb-2">
              Border
            </OverflowTooltip>
          </div>
          <ColorSwatches
            value={footerBorderColor}
            onChange={(value) => updatePageFooterStyle(currentPageId, 'borderColor', value)}
          />
        </div>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="field">
            <OverflowTooltip style={{ width: '120px' }} childrenClassName="tj-text-xsm color-slate12 mb-2">
              Height
            </OverflowTooltip>
          </div>
          <NumberInput
            value={inputValue}
            onChange={(val) => {
              const rounded = roundToNearest10(val);
              setInputValue(rounded);
              updatePageFooterStyle(currentPageId, 'height', rounded);
            }}
            cyLabel="footer-height"
            meta={{ staticText: 'px' }}
            step={10}
            allowTyping={false}
            showNativeStepper
          />
        </div>
      </div>
    </>
  );
};

export default AppFooterStylesPanel;
