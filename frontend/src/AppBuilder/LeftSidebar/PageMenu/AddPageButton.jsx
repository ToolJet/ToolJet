import React, { useState } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import AddPage from '@/_ui/Icon/solidIcons/AddPage';
import AddPageGroup from '@/_ui/Icon/solidIcons/AddPageGroup';
import PlusWithBackground from '@/_ui/Icon/solidIcons/PlusWithBackground';
import useStore from '@/AppBuilder/_stores/store';

export const PageGroupMenu = ({ darkMode }) => {
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
                {/* <img src="/assets/images/icons/editor/left-sidebar/add-page.svg" /> */}
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
                <AddPageGroup height={15} width={14} />
                Group
              </div>
            </div>
          </Popover.Body>
        </Popover>
      }
    >
      <span>
        <button
          onClick={(event) => {
            event.stopPropagation();
            setShowMenu(true);
          }}
          className="left-sidebar-header-btn trigger page-group-trigger-button"
          style={{
            border: '1px solid red',
            outline: 'none',
          }}
        >
          <PlusWithBackground height={15} width={14} />
          <span className="text">Add</span>
        </button>
      </span>
    </OverlayTrigger>
  );
};
