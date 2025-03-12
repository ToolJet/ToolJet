import React, { useState } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import AddPage from '@/_ui/Icon/solidIcons/AddPage';
import AddPageGroup from '@/_ui/Icon/solidIcons/AddPageGroup';
import PlusWithBackground from '@/_ui/Icon/solidIcons/PlusWithBackground';
import useStore from '@/AppBuilder/_stores/store';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const PageGroupMenu = ({ darkMode, isLicensed, disabled }) => {
  const [showMenu, setShowMenu] = useState(false);
  const closeMenu = () => {
    setShowMenu(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && event.target.closest('.pagehandler-menu') === null) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMenu]);

  const toggleShowAddNewPageInput = useStore((state) => state.toggleShowAddNewPageInput);

  if (!isLicensed) {
    return (
      <button
        disabled={disabled}
        onClick={(event) => {
          if (disabled) return;
          event.stopPropagation();
          toggleShowAddNewPageInput(true);
        }}
        className="left-sidebar-header-btn trigger page-group-trigger-button"
        style={{
          outline: 'none',
        }}
      >
        <PlusWithBackground height={15} width={14} />
        <span className="text">Add</span>
      </button>
    );
  }
  return (
    <OverlayTrigger
      trigger={'click'}
      placement={'bottom-end'}
      rootClose={false}
      show={showMenu}
      overlay={
        <Popover id="page-handler-menu-group" className={darkMode && 'dark-theme'}>
          <Popover.Body bsPrefix="popover-body">
            <div className="menu-options mb-0">
              <div
                onClick={() => {
                  toggleShowAddNewPageInput(true);
                  closeMenu();
                }}
                className="option"
              >
                <AddPage height={15} width={14} />
                Page
              </div>
              <div
                onClick={() => {
                  toggleShowAddNewPageInput(true, true);
                  closeMenu();
                }}
                className="option"
              >
                <SolidIcon name="addpagegroup" width="14" />
                Group
              </div>
            </div>
          </Popover.Body>
        </Popover>
      }
    >
      <button
        onClick={(event) => {
          if (disabled) return;
          event.stopPropagation();
          setShowMenu(true);
        }}
        disabled={disabled}
        className="left-sidebar-header-btn trigger page-group-trigger-button"
        style={{
          outline: 'none',
        }}
      >
        <PlusWithBackground height={15} width={14} />
        <span className="text">Add</span>
      </button>
    </OverlayTrigger>
  );
};
