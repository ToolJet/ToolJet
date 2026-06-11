import React, { useState } from 'react';
import './manageEventButton.scss';
import AddRectangle from '@/_ui/Icon/solidIcons/AddRectangle';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SortableList from '@/_components/SortableList';
import { Spinner } from 'react-bootstrap';

const ManageEventButton = ({
  eventName = '',
  eventDisplayName = 'Upon events',
  actionName,
  index,
  removeHandler,
  actionsUpdatedLoader,
  eventsUpdatedLoader,
  eventsDeletedLoader,
  isDisabled,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div style={{ marginBottom: '4px' }}>
      <div
        className="manage-event-btn border-0"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {eventsDeletedLoader ? (
          <div className="d-flex justify-content-center p-2">
            {' '}
            <Spinner style={{ width: '16px', height: '16px', color: 'var(--indigo9)' }} />
          </div>
        ) : (
          <div data-cy="event-handler-card" className="d-flex">
            <span className="d-flex align-items-center px-2">
              <SortableList.DragHandle show />
            </span>
            <div
              className="d-flex flex-column justify-content-center"
              role="button"
              style={{ padding: '6px', width: '100%' }}
            >
              <div className="d-flex w-100 justify-content-between align-items-start">
                <div
                  className="text-truncate event-handler-text tw-mb-0.5"
                  data-cy="event-handler-name"
                  style={{ fontWeight: 500, color: 'var(--text-default)', minHeight: '20px' }}
                >
                  {!eventsUpdatedLoader ? (
                    eventName
                  ) : (
                    <Spinner style={{ width: '16px', height: '16px', color: 'var(--indigo9)' }} />
                  )}
                </div>
                {isHovered && (
                  <ButtonSolid
                    variant="tertiary"
                    size="xs"
                    className={'list-menu-option-btn'}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    style={{ background: 'var(--bg-layer-0)', zIndex: 1 }}
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
              </div>
              {!actionsUpdatedLoader ? (
                <div className="d-flex align-items-center justify-content-between w-100">
                  <div className="text-truncate mr-2" style={{ flex: 1, color: 'var(--text-placeholder, #6a727c)' }}>
                    <small className="font-weight-light text-truncate">{eventDisplayName}</small>
                  </div>
                  <div
                    className="text-truncate text-right d-flex justify-content-end align-items-center"
                    style={{ flex: 1, position: 'relative', color: 'var(--text-placeholder, #6a727c)' }}
                  >
                    <small className="event-action font-weight-light text-truncate">
                      {actionName ? actionName : 'Select action'}
                    </small>
                    {!actionName && <AddRectangle width={13.33} className="ml-1" />}
                  </div>
                </div>
              ) : (
                <Spinner style={{ width: '16px', height: '16px', color: 'var(--indigo9)' }} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEventButton;
