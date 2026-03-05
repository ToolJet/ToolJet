import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import Accordion from '@/_ui/Accordion';
import ColorSwatches from '@/modules/Appbuilder/components/ColorSwatches';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import OverflowTooltip from '@/_components/OverflowTooltip';

const AppHeaderStylesPanel = () => {
  const { moduleId } = useModuleContext();
  const setCanvasHeaderSelected = useStore((state) => state.setCanvasHeaderSelected, shallow);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen, shallow);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab, shallow);
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned);
  const currentPageId = useStore((state) => state.modules[moduleId].currentPageId);
  const updatePageHeaderStyle = useStore((state) => state.updatePageHeaderStyle, shallow);
  const headerBackgroundColor = useStore(
    (state) => state.modules[moduleId].pages.find((p) => p.id === currentPageId)?.pageHeader?.backgroundColor,
    shallow
  );
  const headerBorderColor = useStore(
    (state) => state.modules[moduleId].pages.find((p) => p.id === currentPageId)?.pageHeader?.borderColor,
    shallow
  );

  const handleClose = () => {
    setCanvasHeaderSelected(false);
    setActiveRightSideBarTab(null);
    if (!isRightSidebarPinned) {
      setRightSidebarOpen(false);
    }
  };

  const stylesItems = [
    {
      title: 'Styles',
      children: [
        <div key="background" className="d-flex align-items-center justify-content-between mb-3">
          <div className="field">
            <OverflowTooltip style={{ width: '120px' }} childrenClassName="tj-text-xsm color-slate12 mb-2">
              Background
            </OverflowTooltip>
          </div>
          <ColorSwatches
            value={headerBackgroundColor}
            onChange={(value) => updatePageHeaderStyle(currentPageId, 'backgroundColor', value)}
          />
        </div>,
        <div key="border" className="d-flex align-items-center justify-content-between mb-3">
          <div className="field">
            <OverflowTooltip style={{ width: '120px' }} childrenClassName="tj-text-xsm color-slate12 mb-2">
              Border
            </OverflowTooltip>
          </div>
          <ColorSwatches
            value={headerBorderColor}
            onChange={(value) => updatePageHeaderStyle(currentPageId, 'borderColor', value)}
          />
        </div>,
      ],
    },
  ];

  return (
    <>
      <div className="empty-configuration-header">
        <div className="header">App header</div>
        <div className="icon-btn cursor-pointer flex-shrink-0 p-2 h-4 w-4" onClick={handleClose}>
          <SolidIcon fill="var(--icon-strong)" name={'remove03'} width="16" viewBox="0 0 16 16" />
        </div>
      </div>
      <div className="tj-text-xsm color-slate12">
        <Accordion items={stylesItems} />
      </div>
    </>
  );
};

export default AppHeaderStylesPanel;
