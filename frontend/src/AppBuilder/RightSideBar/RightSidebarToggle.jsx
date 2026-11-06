import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import cx from 'classnames';
import Tooltip from 'react-bootstrap/Tooltip';
import './rightSidebarToggle.scss';
import { Plus, PencilRuler, BookOpen } from 'lucide-react';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { SidebarItem } from './SidebarItem';
import { useCodeMode, useStyleInspectorRail } from '@/AppBuilder/_helpers/codeModeHooks';

const RightSidebarToggle = ({ darkMode = false }) => {
  const [isRightSidebarOpen, setRightSidebarOpen] = useStore(
    (state) => [state.isRightSidebarOpen, state.setRightSidebarOpen],
    shallow
  );
  const { appType } = useModuleContext();
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const activeRightSideBarTab = useStore((state) => state.activeRightSideBarTab);
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned);
  const isAnyComponentSelected = useStore((state) => state.selectedComponents.length > 0);
  const isCanvasHeaderSelected = useStore((state) => state.isCanvasHeaderSelected, shallow);
  const isCanvasFooterSelected = useStore((state) => state.isCanvasFooterSelected, shallow);
  const codeMode = useCodeMode();
  // Code mode: the item is the style inspector's (open, pick, close), not Component properties.
  const styleInspectorRail = useStyleInspectorRail();
  const styleInspector = codeMode ? styleInspectorRail : null;

  const handleToggle = (item) => {
    setActiveRightSideBarTab(item);
    if (item === activeRightSideBarTab && !isRightSidebarPinned) {
      setActiveRightSideBarTab('');
      return setRightSidebarOpen(false);
    }
    if (!isRightSidebarOpen) setRightSidebarOpen(true);
  };

  return (
    <div
      className={`tw-flex tw-flex-col tw-p-2 tw-gap-1.5 right-sidebar-toggle right-sidebar tw-bg-background-surface-layer-01 ${
        darkMode ? 'dark-theme' : ''
      }`}
      data-cy="right-sidebar-inspector"
    >
      {!codeMode && (
        <SidebarItem
          selectedSidebarItem={activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.COMPONENTS}
          onClick={() => {
            handleToggle(RIGHT_SIDE_BAR_TAB.COMPONENTS);
          }}
          darkMode={darkMode}
          icon="plus"
          iconOnly
          className={`left-sidebar-inspector`}
          tip="Components"
        >
          <Plus
            width="16"
            height="16"
            className={`${
              activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.COMPONENTS ? 'tw-text-icon-accent' : 'tw-text-icon-strong'
            }`}
          />
        </SidebarItem>
      )}

      <SidebarItem
        selectedSidebarItem={
          styleInspector ? styleInspector.active : activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION
        }
        onClick={() => {
          if (styleInspector) styleInspector.toggle();
          else handleToggle(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
        }}
        darkMode={darkMode}
        icon="propertiesstyles"
        iconOnly
        iconWidth="14"
        tip={
          codeMode
            ? (styleInspector?.tip ?? 'Style inspector')
            : isAnyComponentSelected || isCanvasHeaderSelected || isCanvasFooterSelected
              ? 'Component properties'
              : 'No component selected'
        }
        disabled={!codeMode && !isAnyComponentSelected && !isCanvasHeaderSelected}
        {...(styleInspector && {
          'aria-label': 'Style inspector',
          'aria-pressed': styleInspector.active,
          'aria-disabled': styleInspector.waiting || undefined,
          'aria-keyshortcuts': styleInspector.shortcut,
        })}
      >
        <PencilRuler
          width="16"
          height="16"
          className={`${
            (styleInspector ? styleInspector.active : activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION)
              ? 'tw-text-icon-accent'
              : 'tw-text-icon-strong'
          }`}
          style={{
            opacity:
              !codeMode && !isAnyComponentSelected && !isCanvasHeaderSelected && !isCanvasFooterSelected
                ? '0.5'
                : undefined,
          }}
        />
      </SidebarItem>
      {appType !== 'module' && !codeMode && (
        <SidebarItem
          selectedSidebarItem={activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.PAGES}
          onClick={() => {
            handleToggle(RIGHT_SIDE_BAR_TAB.PAGES);
          }}
          darkMode={darkMode}
          icon="file01"
          iconOnly
          tip="Page settings"
        >
          <BookOpen
            width="16"
            height="16"
            className={`${
              activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.PAGES ? 'tw-text-icon-accent' : 'tw-text-icon-strong'
            }`}
          />
        </SidebarItem>
      )}
    </div>
  );
};

export default RightSidebarToggle;
