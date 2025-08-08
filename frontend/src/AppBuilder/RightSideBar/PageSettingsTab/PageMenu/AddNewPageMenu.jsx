import React, { useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { Button } from '@/components/ui/Button/Button';
import useStore from '@/AppBuilder/_stores/store';
import { AddEditPagePopup } from './AddNewPagePopup';
import PageOptions from './PageOptions';
import { ToolTip as LicenseTooltip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export function AddNewPageMenu({ darkMode, isLicensed }) {
  const newPageBtnRef = useRef(null);
  const [showMenuPopover, setShowMenuPopover] = useState(false);
  const setNewPagePopupConfig = useStore((state) => state.setNewPagePopupConfig);
  const setEditingPage = useStore((state) => state.setEditingPage);
  const newPagePopupConfig = useStore((state) => state.newPagePopupConfig);

  const handleOpenPopup = (type) => {
    setShowMenuPopover(false);
    setNewPagePopupConfig({ type, show: true, mode: 'add' });
  };

  return (
    <div className={`page-type-buttons-container ${darkMode && 'dark-mode'}`}>
      <Button
        ref={newPageBtnRef}
        key="new-page-btn"
        fill="var(--icon-default)"
        leadingIcon="plus"
        variant="outline"
        className="add-new-page icon-btn"
        id="add-new-page"
        onClick={() => {
          setNewPagePopupConfig({ show: true, mode: 'add', type: 'default' });
        }}
      >
        New page
      </Button>

      <Button
        iconOnly
        leadingIcon="morevertical01"
        className="more-page-opts"
        onClick={() => {
          setShowMenuPopover((prev) => !prev);
          setNewPagePopupConfig({ show: false, mode: null, type: null });
        }}
        variant="outline"
      />

      <Overlay
        target={newPageBtnRef.current}
        show={showMenuPopover}
        placement="bottom"
        rootClose
        onHide={() => setShowMenuPopover(false)}
      >
        <Popover className={darkMode && 'dark-theme theme-dark'} id="add-new-page-popover">
          <div className="menu-options mb-0">
            <PageOptions
              type="url"
              text="Add nav item with URL"
              icon="addnavitemurl"
              darkMode={darkMode}
              onClick={() => handleOpenPopup('url')}
            />
            <PageOptions
              type="app"
              text="Add nav item ToolJet app"
              icon="apps"
              darkMode={darkMode}
              onClick={() => handleOpenPopup('app')}
            />
            <div className={`${!isLicensed && 'd-flex disabled licensed-page-option'}`}>
              <PageOptions
                type="group"
                text="Add nav group"
                icon="folder"
                darkMode={darkMode}
                onClick={() => handleOpenPopup('group')}
              />
              <LicenseTooltip
                message={"Nav group can't be created on free plans"}
                placement="bottom"
                show={!isLicensed}
              >
                <div className="d-flex align-items-center">{!isLicensed && <SolidIcon name="enterprisecrown" />}</div>
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
