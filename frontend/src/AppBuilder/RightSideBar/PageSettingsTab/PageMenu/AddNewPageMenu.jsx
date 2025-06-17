import React, { useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { Button } from '@/components/ui/Button/Button';
import useStore from '@/AppBuilder/_stores/store';
import { AddEditPagePopup } from './AddNewPagePopup';
import PageOptions from './PageOptions';

export function AddNewPageMenu({ darkMode }) {
  const newPageBtnRef = useRef(null);
  const [showMenuPopover, setShowMenuPopover] = useState(false);
  const setNewPagePopupConfig = useStore((state) => state.setNewPagePopupConfig);
  const newPagePopupConfig = useStore((state) => state.newPagePopupConfig);

  const handleOpenPopup = (type) => {
    setShowMenuPopover(false); // Close menu
    setNewPagePopupConfig({ type, show: true, mode: 'add' }); // Open popup
  };

  return (
    <div className="page-type-buttons-container">
      <Button
        ref={newPageBtnRef}
        key="new-page-btn"
        fill="var(--icon-default)"
        leadingIcon="plus"
        variant="secondary"
        className="add-new-page"
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
        <Popover id="add-new-page-popover">
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
            <PageOptions
              type="group"
              text="Add nav group"
              icon="folder"
              darkMode={darkMode}
              onClick={() => handleOpenPopup('group')}
            />
          </div>
        </Popover>
      </Overlay>

      <Overlay
        target={newPageBtnRef.current}
        show={newPagePopupConfig.show && newPagePopupConfig?.mode == 'add'}
        placement="left-start"
        rootClose
        onHide={() => setNewPagePopupConfig({ show: false, mode: null, type: null })}
      >
        <AddEditPagePopup darkMode={darkMode} />
      </Overlay>
    </div>
  );
}
