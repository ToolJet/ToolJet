import React, { useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { shallow } from 'zustand/shallow';
import { Button } from '@/components/ui/Button/Button';
import useStore from '@/AppBuilder/_stores/store';
import { AddEditPagePopup } from './AddNewPagePopup';
import { ToolTip as LicenseTooltip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const isLimitReached = (count, limit) => typeof limit === 'number' && count >= limit;

export function AddNewPageMenu({ darkMode }) {
  const newPageBtnRef = useRef(null);
  const addPageBtnRef = useRef(null);

  const [showMenuPopover, setShowMenuPopover] = useState(false);
  const setNewPagePopupConfig = useStore((state) => state.setNewPagePopupConfig);
  const setEditingPage = useStore((state) => state.setEditingPage);
  const newPagePopupConfig = useStore((state) => state.newPagePopupConfig);
  const hasAppPagesAddNavGroupEnabled = useStore((state) => state.license?.featureAccess?.appPagesAddNavGroupEnabled);
  const appPagesLimit = useStore((state) => state.license?.featureAccess?.appPagesLimit);
  const appPageGroupsLimit = useStore((state) => state.license?.featureAccess?.appPageGroupsLimit);
  const pages = useStore((state) => state?.modules?.canvas?.pages ?? [], shallow);

  const pagesCount = pages.filter((page) => !page.isPageGroup).length;
  const groupsCount = pages.filter((page) => page.isPageGroup).length;
  const isPagesLimitReached = isLimitReached(pagesCount, appPagesLimit);
  const isGroupsLimitReached = isLimitReached(groupsCount, appPageGroupsLimit);
  const isAddNavGroupDisabled = !hasAppPagesAddNavGroupEnabled || isGroupsLimitReached;
  const addNavGroupTooltipMessage = !hasAppPagesAddNavGroupEnabled
    ? "You don't have access to nav groups. Upgrade your plan to access this feature."
    : 'You have reached the page group limit for this plan. Upgrade to add more page groups.';

  const handleOpenPopup = (type) => {
    setShowMenuPopover(false);
    setNewPagePopupConfig({ type, show: true, mode: 'add' });
  };

  return (
    <div
      className={`page-type-buttons-container d-flex justify-content-between custom-gap-12 ${darkMode && 'dark-mode'}`}
    >
      <LicenseTooltip
        message="You have reached the page limit for this plan. Upgrade to add more pages."
        placement="bottom"
        show={isPagesLimitReached}
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
          onClick={() => {
            setNewPagePopupConfig({ show: true, mode: 'add', type: 'default' });
          }}
        >
          New page
        </Button>
      </LicenseTooltip>

      <Button
        ref={addPageBtnRef}
        iconOnly
        leadingIcon="ellipsis-vertical"
        isLucid
        fill="var(--icon-strong)"
        className="more-page-opts"
        onClick={() => {
          setShowMenuPopover((prev) => !prev);
          setNewPagePopupConfig({ show: false, mode: null, type: null });
        }}
        variant="outline"
      />

      <Overlay
        target={addPageBtnRef.current}
        show={showMenuPopover}
        placement="bottom-end"
        rootClose
        onHide={() => setShowMenuPopover(false)}
        popperConfig={{
          modifiers: [
            {
              name: 'flip',
              options: {
                fallbackPlacements: ['top', 'bottom', 'left', 'right'],
                flipVariations: true,
                allowedAutoPlacements: ['top', 'bottom'],
                boundary: 'viewport',
              },
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
            <Button
              variant="ghost"
              onClick={() => handleOpenPopup('url')}
              leadingIcon="link-2"
              isLucid
              className="tw-w-full tw-justify-start"
            >
              Add nav item with URL
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleOpenPopup('app')}
              leadingIcon="app-window"
              isLucid
              className="tw-w-full tw-justify-start"
            >
              Add nav item ToolJet app
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleOpenPopup('custom')}
              leadingIcon="mouse-pointer-click"
              isLucid
              className="tw-w-full tw-justify-start"
            >
              Add custom nav item
            </Button>
            <div className={`${isAddNavGroupDisabled && 'd-flex'}`}>
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
              <LicenseTooltip message={addNavGroupTooltipMessage} placement="bottom" show={isAddNavGroupDisabled}>
                <div className="d-flex align-items-center">
                  {isAddNavGroupDisabled && <SolidIcon name="enterprisecrown" />}
                </div>
              </LicenseTooltip>
            </div>
          </div>
        </Popover>
      </Overlay>

      <Overlay
        target={newPageBtnRef.current}
        show={newPagePopupConfig.show && newPagePopupConfig?.mode == 'add'}
        placement="left-start"
        rootClose
        onHide={() => {
          setNewPagePopupConfig({ show: false, mode: null, type: null });
          setEditingPage(null);
        }}
      >
        <AddEditPagePopup darkMode={darkMode} />
      </Overlay>
    </div>
  );
}
