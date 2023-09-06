import React, { useState } from 'react';
import './manageEventButton.scss';
import AddRectangle from '@/_ui/Icon/solidIcons/AddRectangle';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

const ManageEventButton = ({ eventDisplayName = 'Upon events', actionName, index, removeHandler }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{ marginBottom: '8px' }}>
      <div
        className="manage-event-btn border-0"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div data-cy="event-handler-card">
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
                      }}
                    >
                      <div
                        className="list-item-popover-option"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHandler(index);
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
