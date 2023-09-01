import React, { useState } from 'react';
import './manageEventButton.scss';
import AddRectangle from '@/_ui/Icon/solidIcons/AddRectangle';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

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
                <span>
                  {isHovered && (
                    <ButtonSolid
                      variant="tertiary"
                      size="xs"
                      className={'list-menu-option-btn'}
                      onClick={(event) => {
                        event.stopPropagation();
                        setShowActionsMenu(true);
                      }}
                    >
                      <div
                        className="list-item-popover-option"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMenuClick('Delete');
                        }}
                      >
                        <div className="d-flex align-center">
                          <Trash fill={'#E54D2E'} width={12} />
                        </div>
                      </div>
                    </ButtonSolid>
                  )}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageEventButton;
