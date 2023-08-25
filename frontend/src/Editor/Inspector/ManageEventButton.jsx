import React, { useState } from 'react';
import './manageEventButton.scss';
import AddRectangle from '@/_ui/Icon/solidIcons/AddRectangle';
import { Button } from '@/_ui/LeftSidebar';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import classNames from 'classnames';
import Trash from '@/_ui/Icon/solidIcons/Trash';

const MENU_ACTIONS = [{ label: 'Delete' }];

const ManageEventButton = ({ eventDisplayName = 'Upon events', actionName, index, removeHandler }) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const onMenuClick = (label) => {
    if (label === 'Delete') {
      removeHandler(index);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionsMenu && event.target.closest('.list-menu') === null) {
        setShowActionsMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ showActionsMenu })]);

  return (
    <div className="mb-1">
      <div
        className="manage-event-btn border-0"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={''} data-cy="event-handler-card">
          <div className="d-flex justify-content-between" role="button" style={{ padding: '6px 12px' }}>
            <div className="text-truncate event-handler-text" data-cy="event-handler">
              {eventDisplayName}
            </div>
            <div className="text-truncate event-name-text" data-cy="event-name">
              <small className="event-action font-weight-light text-truncate">
                {actionName ? actionName : 'Select action'}
              </small>
              {!actionName && <AddRectangle width={13.33} />}
              <span>
                <OverlayTrigger
                  trigger={'click'}
                  placement={'bottom-end'}
                  show={showActionsMenu}
                  onToggle={(show) => console.log(show, 'show')}
                  overlay={
                    <Popover id="list-menu">
                      <Popover.Body bsPrefix="list-item-popover-body">
                        {MENU_ACTIONS.map((action) => (
                          <div className="list-item-popover-option" key={action.label}>
                            <div className="list-item-popover-menu-option-icon">
                              {action.label === 'Delete' ? <Trash fill={'#E54D2E'} width={16} /> : action.icon}
                            </div>
                            <div
                              className={classNames('list-item-option-menu-label', {
                                'color-tomato9': action.label === 'Delete',
                              })}
                              onClick={(e) => {
                                e.stopPropagation();
                                onMenuClick(action.label);
                              }}
                            >
                              {action.label}
                            </div>
                          </div>
                        ))}
                      </Popover.Body>
                    </Popover>
                  }
                >
                  <span>
                    {isHovered && (
                      <Button.UnstyledButton
                        onClick={(event) => {
                          event.stopPropagation();
                          setShowActionsMenu(true);
                        }}
                        styles={{ height: '20px', marginLeft: '20px', backgroundColor: 'white' }}
                      >
                        <Button.Content dataCy={`event-handler-menu`} iconSrc={'assets/images/icons/3dots-menu.svg'} />
                      </Button.UnstyledButton>
                    )}
                  </span>
                </OverlayTrigger>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageEventButton;
