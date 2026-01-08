import React, { useEffect, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import cx from 'classnames';
import './rightSidebarToggle.scss';
import { Plus, PencilRuler, BookOpen } from 'lucide-react';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { SidebarItem } from './SidebarItem';
import { usePreviewToggleAnimation } from '../_hooks/usePreviewToggleAnimation';

const RightSidebarToggle = ({ darkMode = false }) => {
  const rightSideBarRef = useRef(null);
  const [isRightSidebarOpen, setRightSidebarOpen] = useStore(
    (state) => [state.isRightSidebarOpen, state.setRightSidebarOpen],
    shallow
  );
  const { appType } = useModuleContext();
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const activeRightSideBarTab = useStore((state) => state.activeRightSideBarTab);
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned);
  const isAnyComponentSelected = useStore((state) => state.selectedComponents.length > 0);
  const { shouldMount, animationClasses } = usePreviewToggleAnimation({
    animationType: 'width',
  });
  const previewPhase = useStore((state) => state.previewPhase, shallow);
  const notifyTransitionDone = useStore((state) => state.notifyTransitionDone, shallow);

  useEffect(() => {
    /**
     * PREVIEW FLOW - Listen for CSS transition completion on collapsed right sidebar.
     * We intentionally attach this to gate the next phase of preview transition.
     */
    if (previewPhase !== 'animating') return;

    const bar = rightSideBarRef.current;
    if (!bar) return;

    bar.addEventListener('transitionend', notifyTransitionDone, { once: true });
    return () => bar.removeEventListener('transitionend', notifyTransitionDone);
  }, [previewPhase]);

  const handleToggle = (item) => {
    setActiveRightSideBarTab(item);
    if (item === activeRightSideBarTab && !isRightSidebarPinned) {
      setActiveRightSideBarTab('');
      return setRightSidebarOpen(false);
    }
    if (!isRightSidebarOpen) setRightSidebarOpen(true);
  };

  // Handle mount/unmount based on PREVIEW animation
  if (!shouldMount) {
    return null;
  }

  return (
    <div
      className={cx(
        'tw-flex tw-flex-col tw-gap-1.5 right-sidebar-toggle right-sidebar tw-bg-background-surface-layer-01',
        animationClasses,
        {
          'dark-theme': darkMode,
          'tw-p-2': true,
        }
      )}
      data-cy="right-sidebar-inspector"
      ref={rightSideBarRef}
    >
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

      <SidebarItem
        selectedSidebarItem={activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION}
        onClick={() => {
          handleToggle(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
        }}
        darkMode={darkMode}
        icon="propertiesstyles"
        iconOnly
        iconWidth="14"
        tip={isAnyComponentSelected ? 'Component properties' : 'No component selected'}
        disabled={!isAnyComponentSelected}
      >
        <PencilRuler
          width="16"
          height="16"
          className={`${
            activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.CONFIGURATION ? 'tw-text-icon-accent' : 'tw-text-icon-strong'
          }`}
          style={{ opacity: !isAnyComponentSelected ? '0.5' : undefined }}
        />
      </SidebarItem>
      {appType !== 'module' && (
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
