import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Button } from '@/_ui/LeftSidebar';
import { EventManager } from '../../Inspector/EventManager';

export const SettingsModal = ({
  page,
  show,
  handleClose,
  darkMode,
  updateOnPageLoadEvents,
  currentState,
  apps,
  pages,
  components,
  dataQueries,
}) => {
  const [isSaving, _setIsSaving] = useState(false);
  console.log({ dataQueries });

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Modal
        show={show}
        onHide={handleClose}
        size="sm"
        centered
        className={`${darkMode && 'theme-dark'} page-handle-edit-modal`}
        backdrop="static"
        enforceFocus={false}
        onClick={(event) => event.stopPropagation()}
      >
        <Modal.Header>
          <Modal.Title style={{ fontSize: '16px', fontWeight: '400' }}>Page Events</Modal.Title>
          <span className="cursor-pointer" size="sm" onClick={handleClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-x"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
        </Modal.Header>
        <Modal.Body>
          <b>Events</b>
          <EventManager
            component={{
              component: {
                definition: {
                  events: page.events ?? [],
                },
              },
            }}
            componentMeta={{ events: { onPageLoad: { displayName: 'On page load' } } }}
            currentState={currentState}
            dataQueries={dataQueries}
            components={components}
            apps={apps}
            pages={pages}
            eventsChanged={(events) => updateOnPageLoadEvents(page.id, events)}
            popOverCallback={(showing) => showing}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button darkMode={darkMode} styles={{ height: '32px' }} disabled={isSaving} onClick={handleClose}>
            <Button.Content title="Close" />
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
