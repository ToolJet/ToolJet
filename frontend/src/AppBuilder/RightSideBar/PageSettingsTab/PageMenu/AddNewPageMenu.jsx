import React, { useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { shallow } from 'zustand/shallow';
import { Button } from '@/components/ui/Button/Button';
import PanelIconButton from '@/AppBuilder/Shared/Panel/PanelIconButton';
import useStore from '@/AppBuilder/_stores/store';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { ToolTip as LicenseTooltip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const isLimitReached = (count, limit) => typeof limit === 'number' && count >= limit;

const isLimitNearing = (count, limit) =>
  typeof limit === 'number' && count < limit && (count / limit >= 0.9 || (limit <= 10 && count === limit - 1));

const PAGE_LIMIT_TOOLTIP = "You've reached your page limit. Upgrade your plan to create more pages.";

const NAV_ITEM_OPTIONS = [
  { type: 'url', icon: 'link-2', label: 'Add nav item with URL' },
  { type: 'app', icon: 'app-window', label: 'Add nav item ToolJet app' },
  { type: 'custom', icon: 'mouse-pointer-click', label: 'Add custom nav item' },
];

export function AddNewPageMenu({ darkMode }) {
  const newPageBtnRef = useRef(null);
  const addPageBtnRef = useRef(null);

  const [showMenuPopover, setShowMenuPopover] = useState(false);
  const setNewPagePopupConfig = useStore((state) => state.setNewPagePopupConfig);
  const setEditingPage = useStore((state) => state.setEditingPage);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen);
  const hasAppPagesAddNavGroupEnabled = useStore((state) => state.license?.featureAccess?.appPagesAddNavGroupEnabled);
  const appPagesLimit = useStore((state) => state.license?.featureAccess?.appPagesLimit);
  const appPageGroupsLimit = useStore((state) => state.license?.featureAccess?.appPageGroupsLimit);
  const pages = useStore((state) => state?.modules?.canvas?.pages ?? [], shallow);

  const pagesCount = pages.filter((page) => !page.isPageGroup).length;
  const groupsCount = pages.filter((page) => page.isPageGroup).length;
  const isPagesLimitReached = isLimitReached(pagesCount, appPagesLimit);
  const isGroupsLimitReached = isLimitReached(groupsCount, appPageGroupsLimit);
  const isPagesLimitNearing = isLimitNearing(pagesCount, appPagesLimit);
  const isGroupsLimitNearing = isLimitNearing(groupsCount, appPageGroupsLimit);
  const showPagesLimitTooltip = isPagesLimitReached || isPagesLimitNearing;
  const pagesLimitTooltipMessage = isPagesLimitReached
    ? PAGE_LIMIT_TOOLTIP
    : `You're nearing your page limit (${pagesCount}/${appPagesLimit}). Upgrade your plan to create more pages.`;
  const isAddNavGroupDisabled = !hasAppPagesAddNavGroupEnabled || isGroupsLimitReached;
  const showAddNavGroupTooltip = isAddNavGroupDisabled || isGroupsLimitNearing;
  const addNavGroupTooltipMessage = !hasAppPagesAddNavGroupEnabled
    ? "You don't have access to nav groups. Upgrade your plan to access this feature."
    : isGroupsLimitReached
      ? "You've reached your page group limit. Upgrade your plan to create more page groups."
      : `You're nearing your page group limit (${groupsCount}/${appPageGroupsLimit}). Upgrade your plan to create more page groups.`;

  const handleOpenPopup = (type) => {
    setShowMenuPopover(false);
    setEditingPage(null);
    setNewPagePopupConfig({ type, show: true, mode: 'add' });
    setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.PAGE_CONFIGURATION);
    setRightSidebarOpen(true);
  };

  return (
    <div
      className={`page-type-buttons-container d-flex justify-content-between custom-gap-12 ${darkMode && 'dark-mode'}`}
    >
      <LicenseTooltip
        message={pagesLimitTooltipMessage}
        placement="bottom"
        show={showPagesLimitTooltip}
        tooltipClassName="page-limit-tooltip"
      >
        <Button
          ref={newPageBtnRef}
          key="new-page-btn"
          fill="var(--icon-default)"
          leadingIcon="plus"
          isLucid
          variant="outline"
          className="add-new-page icon-btn d-flex flex-grow-1"
          id="add-new-page"
          disabled={isPagesLimitReached}
          onClick={() => handleOpenPopup('default')}
        >
          New page
        </Button>
      </LicenseTooltip>

      <PanelIconButton
        ref={addPageBtnRef}
        label="Add nav item"
        leadingIcon="ellipsis-vertical"
        isLucid
        fill="var(--icon-strong)"
        className="more-page-opts"
        onClick={() => {
          setShowMenuPopover((prev) => !prev);
        }}
        variant="outline"
      />

      <Overlay
        target={addPageBtnRef.current}
        show={showMenuPopover}
        // The button is pinned to the bottom of the Pages panel, so the menu opens upward.
        placement="top-end"
        rootClose
        onHide={() => setShowMenuPopover(false)}
        popperConfig={{
          modifiers: [
            {
              name: 'flip',
              options: { fallbackPlacements: ['bottom-end'] },
            },
            {
              name: 'offset',
              options: {
                offset: [0, 2],
              },
            },
          ],
        }}
      >
        <Popover className={`!tw-rounded-[8px] !tw-border-[var(--border-weak)] ${darkMode && 'dark-theme theme-dark'}`}>
          <div className="add-new-page-popover-header">Add new nav item</div>
          <div className="add-new-page-options">
            {NAV_ITEM_OPTIONS.map(({ type, icon, label }) => (
              <LicenseTooltip
                key={type}
                message={pagesLimitTooltipMessage}
                placement="bottom"
                show={showPagesLimitTooltip}
                tooltipClassName="page-limit-tooltip"
              >
                <div className="tw-w-full">
                  <Button
                    variant="ghost"
                    onClick={() => handleOpenPopup(type)}
                    leadingIcon={icon}
                    isLucid
                    className={`tw-w-full tw-justify-start ${isPagesLimitReached ? 'tw-opacity-[0.5]' : ''}`}
                    disabled={isPagesLimitReached}
                  >
                    {label}
                  </Button>
                </div>
              </LicenseTooltip>
            ))}
            <div className={`${isAddNavGroupDisabled && 'd-flex'}`}>
              <LicenseTooltip
                message={addNavGroupTooltipMessage}
                placement="bottom"
                show={showAddNavGroupTooltip}
                tooltipClassName="page-group-limit-tooltip"
              >
                <div className="d-flex align-items-center tw-w-full">
                  <Button
                    variant="ghost"
                    onClick={() => handleOpenPopup('group')}
                    leadingIcon="folder-open-dot"
                    isLucid
                    className={`${!isAddNavGroupDisabled ? 'tw-w-full' : 'tw-opacity-[0.5]'} tw-justify-start`}
                    disabled={isAddNavGroupDisabled}
                  >
                    Add nav group
                  </Button>
                  {!hasAppPagesAddNavGroupEnabled && <SolidIcon name="enterprisecrown" />}
                </div>
              </LicenseTooltip>
            </div>
          </div>
        </Popover>
      </Overlay>
    </div>
  );
}
