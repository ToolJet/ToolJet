import React, { useState } from 'react';
import WebhookPopup from '../WebhookPopup/index';
import WebhookUp from '../LeftSidebar/icons/webhookUp.svg';
import WebhookDown from '../LeftSidebar/icons/webhookDown.svg';

function Trigger(props) {
  const { editorSession, editorSessionActions } = props;

  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const dropdownIcon = isOpen ? (
    <WebhookUp style={{ width: '10px', height: '8px' }} />
  ) : (
    <WebhookDown style={{ width: '10px', height: '8px' }} />
  );
  return (
    <div className="position-relative">
      {editorSession.leftDrawer?.display === 'trigger' && (
        <div
          className="left-sidebar-drawer"
          onWheel={(event) => {
            event.stopPropagation();
            event.preventDefault();
          }}
          style={{ marginLeft: '0.5px' }}
        >
          <div className="container p-0">
            <div className="row title-row">
              <div className="col">
                <p className="title-text">Triggers</p>
              </div>
            </div>
            <div className="row list-row">
              <div className="col border-bottom pb-2 cursor-pointer">
                <div className="d-flex align-items-center justify-content-between mt-2 p-2" onClick={toggleDropdown}>
                  <p className="mb-0 font-weight-bold">Webhooks</p>
                  <span className="dropdown-icon">{dropdownIcon}</span>
                </div>
                <WebhookPopup
                  isOpen={isOpen}
                  editorSession={editorSession}
                  editorSessionActions={editorSessionActions}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Trigger;
